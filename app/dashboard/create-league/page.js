import CreateLeague from "@/components/forms/CreateLeague";
import React from "react";

const page = () => {
  return (
    <main className="min-h-screen p-8 pb-24">
      <section className="max-w-7xl lg:mx-auto p-5 md:px-10 xl:px-0 w-full my-8 flex flex-col gap-2 md:gap-6">
        <CreateLeague />
      </section>
    </main>
  );
};

export default page;
