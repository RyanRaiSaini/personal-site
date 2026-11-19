import NewsContent from "../components/sections/NewsContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("news");

export default function Page() {
  return (
    <SectionPanel id="news">
      <NewsContent />
    </SectionPanel>
  );
}
