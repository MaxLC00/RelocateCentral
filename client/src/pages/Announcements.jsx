import AnnouncementBoard from "../components/AnnouncementBoard.jsx";

export default function Announcements() {
  return (
    <div>
      <div className="page-header">
        <h1>Announcements</h1>
        <p>
          The latest building-wide updates on repairs, relocation, meetings, and
          urgent notices. Pinned items appear first.
        </p>
      </div>
      <AnnouncementBoard />
    </div>
  );
}
