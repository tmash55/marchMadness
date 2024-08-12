import CombinedDraftComponent from "@/components/CombinedDraftComponent";
import DraftBoard from "@/components/DraftBoard";
import MarchDraft from "@/components/MarchDraft";
import React from "react";

const page = () => {
  return (
    <div>
      <MarchDraft />
      <DraftBoard />
    </div>
  );
};

export default page;
