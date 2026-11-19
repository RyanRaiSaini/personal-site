import LiveContent from "../components/sections/LiveContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("live");

export default function Page() {
  return (
    <SectionPanel id="live">
      <LiveContent />
    </SectionPanel>
  );
}
