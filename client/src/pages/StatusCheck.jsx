import StatusChecker from "../components/StatusChecker.jsx";

export default function StatusCheck() {
  return (
    <div>
      <div className="page-header">
        <h1>Unit Status Check</h1>
        <p>
          Enter your first initial and last name (for example, <strong>J Doe</strong>)
          to see your scheduled return week.
        </p>
      </div>
      <StatusChecker />
    </div>
  );
}
