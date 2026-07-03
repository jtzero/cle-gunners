import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import type { NotificationAttributesType } from "@/content.types";

export const GET: APIRoute = async () => {
  const notifications = await getCollection(
    "notifications",
    ({ data }) => data.send,
  );
  return new Response(
    JSON.stringify(
      notifications.reduce(
        (
          acc: { [key: string]: NotificationAttributesType },
          curr: CollectionEntry<"notifications">,
        ) => {
          if (!curr.data.enabled) return acc;
          acc[curr.id] = curr.data;
          return acc;
        },
        {},
      ),
    ),
  );
};
