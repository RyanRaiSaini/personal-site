import ExperienceContent from "../components/sections/ExperienceContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("experience");

export default function Page() {
  return (
    <SectionPanel id="experience">
      <ExperienceContent />
    </SectionPanel>
  );
}
