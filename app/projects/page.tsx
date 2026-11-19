import ProjectsContent from "../components/sections/ProjectsContent";
import SectionPanel from "../components/ui/SectionPanel";
import { sectionMetadata } from "../sections/registry";

export const metadata = sectionMetadata("projects");

export default function Page() {
  return (
    <SectionPanel id="projects">
      <ProjectsContent />
    </SectionPanel>
  );
}
