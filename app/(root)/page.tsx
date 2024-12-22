import ProductCard from "@/components/ProductCard";
import PromptInput from "@/components/PromptInput";
import { placeholderRecommendations } from "@/constants";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen md:w-screen">
      <div className="md:w-1/2 flex flex-col gap-2 items-center">
        <h1 className="text-3xl font-playfair">Looking for something?</h1>
        <p className="text-muted-foreground mb-5">
          Search and discover everything.
        </p>
        <PromptInput />
        <div className="md:w-screen flex flex-col items-center mt-6">
          <h1 className="w-[60%] mb-3 font-playfair">AI Recommendations</h1>
          <div className="flex flex-row gap-2 justify-center items-center w-[60%]">
            {placeholderRecommendations.map((product, index) => (
              <div key={index} className="text-muted-foreground md:w-[25%]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
