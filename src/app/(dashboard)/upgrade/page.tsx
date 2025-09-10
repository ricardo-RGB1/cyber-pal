import { Suspense } from "react";
import { ErrorBoundary } from "react-error-boundary";
import { HydrationBoundary, dehydrate } from "@tanstack/react-query";
import { getQueryClient, trpc } from "@/trpc/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import {
  UpgradeViewLoading,
  UpgradeViewError,
  UpgradeView,
} from "@/modules/premium/ui/views/upgrade-view";

const UpgradePage = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session) {
    redirect("/sign-in");
  }

  const queryClient = getQueryClient();
  // "I know this returns a Promise, but I don't want to await it or handle it" - void is used to tell the compiler that we don't care about the return value
  void queryClient.prefetchQuery(trpc.premium.getProducts.queryOptions());
  void queryClient.prefetchQuery(
    trpc.premium.getCurrentSubscription.queryOptions()
  );

  const dehydratedState = dehydrate(queryClient);

  return (
    <HydrationBoundary state={dehydratedState}>
      <Suspense fallback={<UpgradeViewLoading />}>
        <ErrorBoundary fallback={<UpgradeViewError />}>
          <UpgradeView />
        </ErrorBoundary>
      </Suspense>
    </HydrationBoundary>
  );
};

export default UpgradePage;
  