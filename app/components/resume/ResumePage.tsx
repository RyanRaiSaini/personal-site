import { resume } from "../../data/resume";
import "./resume.css";

// The résumé as a web page, laid out like the printed one. It is real
// text, so it can be read aloud, searched and copied. Sizes are in
// "cqw" units (a share of the page's own width), so the whole sheet
// scales like a picture of a page while staying sharp.
//
// The words come from app/data/resume.ts.

function Rich({ text }: { text: string }) {
  return (
    <>
      {text
        .split(/(\*\*[^*]+\*\*)/g)
        .filter(Boolean)
        .map((part, i) => (part.startsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : <span key={i}>{part}</span>))}
    </>
  );
}

export default function ResumePage() {
  return (
    <div className="resume-sheet">
      <div className="resume-page">
        <h2 className="resume-name">{resume.name}</h2>
        <p className="resume-contact">
          {resume.contact.map((item, i) => (
            <span key={item.text}>
              {i > 0 && <span aria-hidden="true"> | </span>}
              {item.href ? <a href={item.href}>{item.text}</a> : item.text}
            </span>
          ))}
        </p>

        {resume.sections.map((section) => (
          <section key={section.heading}>
            <h3 className="resume-heading">{section.heading}</h3>
            {section.entries.map((entry) => {
              const [main, ...rest] = entry.title.split(" | ");
              return (
                <div key={entry.title} className="resume-entry">
                  <div className="resume-row">
                    <p>
                      <strong>{main}</strong>
                      {rest.length > 0 && (
                        <>
                          {" | "}
                          <em className="resume-small">{rest.join(" | ")}</em>
                        </>
                      )}
                    </p>
                    <p>{entry.date}</p>
                  </div>
                  <div className="resume-row resume-small">
                    <p>
                      <em>{entry.subtitle}</em>
                    </p>
                    <p>
                      <em>{entry.location}</em>
                    </p>
                  </div>
                  {entry.bullets.length > 0 && (
                    <ul>
                      {entry.bullets.map((bullet) => (
                        <li key={bullet.slice(0, 40)}>
                          <Rich text={bullet} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </section>
        ))}

        <section>
          <h3 className="resume-heading">Technical Skills</h3>
          <div className="resume-skills">
            {resume.skills.map((line) => (
              <p key={line.label}>
                <strong>{line.label}:</strong> {line.value}
              </p>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
