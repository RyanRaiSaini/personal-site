import ContactContent from "../components/sections/ContactContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("contact");

export default function Page() {
  return (
    <SectionPanel id="contact">
      <ContactContent />
    </SectionPanel>
  );
}
