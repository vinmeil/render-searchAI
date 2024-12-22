import PromptInput from "@/components/PromptInput";

export default function Home() {
  return (
    <div className="flex items-center justify-center h-screen md:w-screen">
      <div className="md:w-1/2 flex flex-col gap-2 items-center md:-mt-60">
        <h1 className="text-3xl font-playfair">Looking for something?</h1>
        <p className="text-muted-foreground mb-5">
          Search and discover everything.
        </p>
        <PromptInput />
      </div>
    </div>
  );
}
