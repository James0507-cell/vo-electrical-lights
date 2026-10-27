const items = [
  "Solar installation",
  "Solar street lighting",
  "Solar-powered irrigation",
  "Ground-mounted arrays",
  "Residential rooftops",
  "Commercial & industrial",
  "Electrical supplies",
  "CCTV, FDAS & transformer works",
  "Nationwide delivery",
];

export default function CredentialBar() {
  const row = [...items, ...items];
  return (
    <div className="credbar" aria-label="What we do">
      <div className="credbar__track">
        {row.map((item, i) => (
          <span className="credbar__item" key={`${item}-${i}`} aria-hidden={i >= items.length}>
            {item}
            <i aria-hidden="true" />
          </span>
        ))}
      </div>
    </div>
  );
}
