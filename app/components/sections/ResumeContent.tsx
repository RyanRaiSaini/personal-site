import { profile, resumeText } from "../../data/portfolio";
import { resume } from "../../data/resume";
import ResumePage from "../resume/ResumePage";
import { Arrow } from "./parts";

// Résumé: the ticket office. The sheet below is made from
// app/data/resume.ts, and so is the PDF behind the download button.
export default function ResumeContent() {
  return (
    <div className="sec !gap-5">
      <div className="flex flex-wrap items-center gap-3">
        <a href={profile.resumeUrl} download={resume.pdf.file} className="btn btn-primary">
          Download PDF
        </a>
        <a href={profile.resumeUrl} target="_blank" rel="noopener noreferrer" className="btn">
          Open in a new tab <Arrow />
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
      <ResumePage />
      <p className="meta">{resumeText.note}</p>
    </div>
  );
}
