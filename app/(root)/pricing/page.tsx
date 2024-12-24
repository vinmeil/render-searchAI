import React from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const Pricing = () => {
  // Function to handle the Monthly Premium button click
  const onMonthlyButtonClick = async () => {
    try {
      const response = await fetch("/api/monthly-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "monthly",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process the monthly payment.");
      }

      const data = await response.json();
      console.log("Monthly payment response:", data);
      // Handle success (e.g., redirect to a confirmation page)
    } catch (error) {
      console.error("Error during monthly payment:", error);
    }
  };

  // Function to handle the Yearly Premium button click
  const onYearlyButtonClick = async () => {
    try {
      const response = await fetch("/api/yearly-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          plan: "yearly",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process the yearly payment.");
      }

      const data = await response.json();
      console.log("Yearly payment response:", data);
      // Handle success (e.g., redirect to a confirmation page)
    } catch (error) {
      console.error("Error during yearly payment:", error);
    }
  };

// const Pricing = () => {
  // TODO: add content and logic for pricing page
  return (
    <div className="w-screen h-screen flex justify-center">
      <div className="w-4/5 flex flex-col items-center md:mt-24">
        <h1 className="w-full text-5xl font-playfair text-center">
          Save money while shopping online.
        </h1>
        <h3 className="mt-3 text-muted-foreground text-xl">
          Get started with our free plan.
        </h3>
        <div className="w-full flex flex-row gap-3 items-center justify-center mt-8">
          <Card className="relative w-1/3 md:h-[550px]">
            <CardHeader>
              <CardTitle className="font-playfair text-4xl">Free</CardTitle>
              <CardDescription>
                For people who only shop casually, or enjoy window shopping.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 justify-center w-full absolute bottom-5">
              <h2 className="font-semibold text-3xl">RM0</h2>
              <Button className="bg-primary-2">Try Free</Button>
            </CardFooter>
          </Card>
          <Card className="relative w-1/3 bg-primary-2 md:h-[570px] text-white">
            <CardHeader>
              <CardTitle className="font-playfair text-4xl">
                Monthly Premium
              </CardTitle>
              <CardDescription className="text-white text-opacity-70">
                For people who want to buy things online during certain seasons
                and months.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 justify-center w-full absolute bottom-5">
              <h2 className="font-semibold text-3xl">RM5/Month</h2>
              <Button className="bg-white text-primary-2">Get started</Button>
            </CardFooter>
          </Card>
          <Card className="relative w-1/3 md:h-[550px]">
            <CardHeader>
              <CardTitle className="font-playfair text-4xl">
                Yearly Premium
              </CardTitle>
              <CardDescription>
                For people who often buy things online.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p>Card Content</p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3 justify-center w-full absolute bottom-5">
              <h2 className="font-semibold text-3xl">RM50/Year</h2>
              <Button className="bg-primary-2">Get started</Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Pricing;
