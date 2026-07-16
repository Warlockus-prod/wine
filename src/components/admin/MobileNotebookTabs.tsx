import type { Dispatch, SetStateAction } from "react";
import type { PairingDataset } from "@/types/pairing";
import type { AdminMobileTab } from "./shared";

type MobileNotebookTabsProps = {
  dataset: PairingDataset;
  mobileTab: AdminMobileTab;
  setMobileTab: Dispatch<SetStateAction<AdminMobileTab>>;
};

export default function MobileNotebookTabs({
  dataset,
  mobileTab,
  setMobileTab,
}: MobileNotebookTabsProps) {
  return (
    <div className="notebook-tabs sticky top-20 z-30 mt-6 flex gap-0 bg-background-dark pb-3 xl:hidden">
      <button
        type="button"
        onClick={() => setMobileTab("dishes")}
        className={`notebook-tab flex-1 ${mobileTab === "dishes" ? "notebook-tab--active" : ""}`}
      >
        Dishes ({dataset.dishes.length})
      </button>
      <button
        type="button"
        onClick={() => setMobileTab("wines")}
        className={`notebook-tab flex-1 ${mobileTab === "wines" ? "notebook-tab--active" : ""}`}
      >
        Wines ({dataset.wines.length})
      </button>
    </div>
  );
}
