import { Link } from "react-router-dom";
import AnnouncementBoard from "../components/AnnouncementBoard.jsx";
import StatusChecker from "../components/StatusChecker.jsx";
import ContactForm from "../components/ContactForm.jsx";

export default function ResidentPortal() {
  return (
    <div>
      <div className="page-header">
        <h1>Resident Portal</h1>
        <p>
          Everything you need in one place: read the latest announcements, check
          your unit's repair status, and reach the building team.
        </p>
      </div>

      <section style={{ marginBottom: "3rem" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: "0.5rem",
          }}
        >
          <h2 className="section-title">📢 Latest Announcements</h2>
          <Link to="/announcements">View all →</Link>
        </div>
        <p className="section-sub">The most recent building updates.</p>
        <AnnouncementBoard limit={3} showFilters={false} />
      </section>

      <section style={{ marginBottom: "3rem" }}>
        <h2 className="section-title">🔍 Check Your Unit Status</h2>
        <p className="section-sub">
          Enter your unit number to see repair progress and recent updates.
        </p>
        <StatusChecker />
      </section>

      <section>
        <h2 className="section-title">✉️ Contact the Team</h2>
        <p className="section-sub">
          Questions or concerns? Send a message to the property team.
        </p>
        <ContactForm />
      </section>
    </div>
  );
}
