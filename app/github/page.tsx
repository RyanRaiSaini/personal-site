import GithubContent from "../components/sections/GithubContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("github");

export default function Page() {
  return (
    <SectionPanel id="github">
      <GithubContent />
    </SectionPanel>
  );
}
