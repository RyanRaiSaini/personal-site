import ResumeContent from "../components/sections/ResumeContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("resume");

export default function Page() {
  return (
    <SectionPanel id="resume">
      <ResumeContent />
    </SectionPanel>
  );
}
