import AwardsContent from "../components/sections/AwardsContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("awards");

export default function Page() {
  return (
    <SectionPanel id="awards">
      <AwardsContent />
    </SectionPanel>
  );
}
