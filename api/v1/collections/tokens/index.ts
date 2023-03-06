import { VercelRequest, VercelResponse } from "@vercel/node/dist/index";
import { isAddress, getAddress } from "ethers/lib/utils.js";
import get from "lodash/get";
import { CONTENT_DELIVERY_NETWORK_URI, NETWORK } from "../../../../utils";
import { Attribute, Token, Collection } from "../../../../utils/types";
import { getModel } from "../../../../utils/mongo";
import { paramCase } from "param-case";


/**
 * Fetch tokens from a generic collection
 * @param collection
 * @returns
 */
const fetchGeneric = async (collection: Collection, page: number, size: number) => {
  const tokenModel = await getModel("Token");
  const tokens = await tokenModel.paginate(
    { parent_collection: collection },
    {
      page: page,
      limit: size,
      sort: { token_id: "asc" },
      populate: ["metadata", "attributes"],
      collation: { locale: "en_US", numericOrdering: true },
    }
  );

  let data = {};
  const attributesDistribution: { [key: string]: { [key: string]: number } } = {};
  tokens.docs.forEach((token: Token) => {
    const metaName = paramCase(token.metadata.name);
    data = {
      ...data,
      [token.token_id]: {
        tokenId: token.token_id,
        name: token.metadata.name,
        description: token.metadata.description,
        image: {
          original: `${CONTENT_DELIVERY_NETWORK_URI}/${NETWORK}/${getAddress(collection.address)}/${metaName}.png`,
          thumbnail: `${CONTENT_DELIVERY_NETWORK_URI}/${NETWORK}/${getAddress(
            collection.address
          )}/${metaName}-1000.png`,
          mp4: token.metadata.mp4
            ? `${CONTENT_DELIVERY_NETWORK_URI}/${NETWORK}/${getAddress(collection.address)}/${metaName}.mp4`
            : null,
          webm: token.metadata.webm
            ? `${CONTENT_DELIVERY_NETWORK_URI}/${NETWORK}/${getAddress(collection.address)}/${metaName}.webm`
            : null,
          gif: token.metadata.gif
            ? `${CONTENT_DELIVERY_NETWORK_URI}/${NETWORK}/${getAddress(collection.address)}/${metaName}.gif`
            : null,
        },
        attributes: token.attributes
          ? token.attributes.map((attribute: Attribute) => ({
              traitType: attribute.trait_type,
              value: attribute.value,
              displayType: attribute.display_type,
            }))
          : [],
        collection: {
          name: collection.name,
        },
      },
    };

    // update the attributesDistribution distribution according to this token attributes
    token.attributes.forEach((attribute) => {
      const traitType = attribute.trait_type;
      const traitValue = attribute.value;
      // Safe checks on the object structure
      if (!get(attributesDistribution, traitType)) {
        attributesDistribution[traitType] = {};
      }
      if (!get(attributesDistribution, [traitType, traitValue])) {
        attributesDistribution[traitType][traitValue] = 0;
      }

      attributesDistribution[traitType][traitValue] += 1;
    });
  });

  return { data, attributesDistribution };
};


export default async (req: VercelRequest, res: VercelResponse): Promise<VercelResponse | void> => {
  if (req.method?.toUpperCase() === "OPTIONS") {
    return res.status(204).end();
  }

  const address = req.query.address as string;

  // Sanity check for address; to avoid any SQL-like injections, ...
  if (address && isAddress(address)) {
    const collectionModel = await getModel("Collection");
    const collection: Collection = await collectionModel.findOne({ address: address.toLowerCase() }).exec();
    if (!collection) {
      return res.status(404).json({ error: { message: "Entity not found." } });
    }

    const { data, attributesDistribution } =
      await fetchGeneric(
            collection,
            req.query.page ? parseInt(req.query.page as string, 10) : 1,
            req.query.size ? parseInt(req.query.size as string, 10) : 10000
      );

    const total = Object.keys(data).length;
    if (total === 0) {
      return res.status(404).json({ error: { message: "Entity not found." } });
    }
    return res.status(200).json({ attributesDistribution, total, data });
  }

  return res.status(400).json({ error: { message: "Invalid address." } });
};
