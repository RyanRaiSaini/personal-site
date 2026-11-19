import SkillsContent from "../components/sections/SkillsContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("skills");

export default function Page() {
  return (
    <SectionPanel id="skills">
      <SkillsContent />
    </SectionPanel>
  );
}
