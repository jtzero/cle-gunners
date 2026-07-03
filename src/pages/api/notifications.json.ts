import { getCollection, type CollectionEntry } from "astro:content";
import type { APIRoute } from "astro";
import type { NotificationAttributesType } from "@/content.types";
import type { WithRequired } from "@/lib/withRequired";

type PushNotification = WithRequired<NotificationAttributesType, "pushMessage">;

interface PushNotificationCollectionEntry
  extends CollectionEntry<"notifications"> {
  data: PushNotification;
}

export const GET: APIRoute = async () => {
  const notifications = (await getCollection(
    "notifications",
    ({ data }) => data?.push && data?.pushMessage,
  )) as PushNotificationCollectionEntry[];
  console.log(notifications);
  return new Response(
    JSON.stringify(
      notifications.reduce(
        (
          acc: { [key: string]: PushNotification },
          curr: PushNotificationCollectionEntry,
        ) => {
          acc[curr.id] = curr.data;
          return acc;
        },
        {},
      ),
    ),
  );
};
