import { Link } from "react-router-dom";

const sections = [
  {
    icon: "🏠",
    title: "Residents",
    text: "Read announcements, check your unit's repair status, and reach the property team — all in one place.",
    to: "/portal",
    cta: "Enter Resident Portal",
    accent: "residents",
  },
  {
    icon: "🔑",
    title: "Relocation & Property Team",
    text: "Staff login to post announcements and update repair and move-out progress.",
    to: "/login",
    cta: "Team Login",
    accent: "team",
  },
  {
    icon: "✉️",
    title: "Contact Us",
    text: "Have a question or concern? Send a message straight to the property team.",
    to: "/contact",
    cta: "Go to Contact Form",
    accent: "contact",
  },
];

export default function Home() {
  return (
    <div>
      <section className="hero">
        <h1>Allerton Repair Progress Portal</h1>
        <p>
          A central place for residents, ownership, and relocation teams to communicate and
          follow building-wide repairs, move-out, and move-in progress.
        </p>
      </section>

      <div className="card-grid home-sections">
        {sections.map((s) => (
          <div key={s.title} className={`card feature-card accent-${s.accent}`}>
            <div className="feature-icon">{s.icon}</div>
            <h3>{s.title}</h3>
            <p>{s.text}</p>
            <Link to={s.to} className="btn btn-primary section-cta">
              {s.cta}
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
