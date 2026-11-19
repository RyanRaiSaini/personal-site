import AboutContent from "../components/sections/AboutContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("about");

export default function Page() {
  return (
    <SectionPanel id="about">
      <AboutContent />
    </SectionPanel>
  );
}
