"use client";

import { useSuspenseQuery } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { authClient } from "@/lib/auth-client";
import { ErrorState } from "@/components/error-state";
import { LoadingState } from "@/components/loading-state";
import { PricingCard } from "../components/pricing-card";

export const UpgradeView = () => {
  const trpc = useTRPC();
  // get the products from the server
  const { data: products } = useSuspenseQuery(
    trpc.premium.getProducts.queryOptions()
  );
  // get the current subscription from the server
  const { data: currentSubscription } = useSuspenseQuery(
    trpc.premium.getCurrentSubscription.queryOptions()
  );

  return (
    <div className="flex-1 py-4 px-4 md:px-8 flex flex-col gap-y-10">
      <div className="mt-4 flex-1 flex flex-col gap-y-10 items-center">
        <h5 className="font-medium text-2xl md:text-3xl">
          You are currently on the{" "}
          <span className="font-semibold text-primary">
            {currentSubscription?.name ?? "Free"}
          </span>{" "}
          plan
        </h5>
        {/* pricing cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {products.map((product) => {
            const isCurrentProduct = currentSubscription?.id === product.id; // current subscription same as the product
            const isPremium = !!currentSubscription; // check if the user has a premium subscription

            let buttonText = "Upgrade Now";
            // checkout the product
            let onClick = () => authClient.checkout({ products: [product.id] });

            // If user is already on this product, show manage subscription option
            if (isCurrentProduct) { 
              buttonText = "Manage Subscription";
              onClick = () => authClient.customer.portal();
            } 
            // If user has premium but different product, show switch plan option
            else if (isPremium) { 
              buttonText = "Switch Plan";
              onClick = () => authClient.customer.portal();
            }

            return (
              <PricingCard
                key={product.id}
                buttonText={buttonText}
                onClick={onClick}
                description={product.description ?? null}
                priceSuffix={`/${product.prices[0].recurringInterval}`}
                badge={product.metadata.badge as string | null}
                variant={
                  product.metadata.variant === "highlighted"
                    ? "highlighted"
                    : "default"
                }
                title={product.name}
                price={
                  // price has to be a number (cannnot use priceAmount b/c its a type of "any")
                  product.prices[0].amountType === "fixed"
                    ? product.prices[0].priceAmount / 100
                    : 0
                }
                features={product.benefits.map(
                  (benefit) => benefit.description
                )}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const UpgradeViewLoading = () => {
  return (
    <LoadingState title="Loading" description="This may take a few seconds" />
  );
};

export const UpgradeViewError = () => {
  return <ErrorState title="Error" description="Something went wrong" />;
};
