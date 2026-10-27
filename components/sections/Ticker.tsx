const items = [
  "Solar installation",
  "Solar street lighting",
  "Solar-powered irrigation",
  "Ground-mounted arrays",
  "Electrical supplies",
  "CCTV · FDAS",
  "Transformer works",
  "Nationwide delivery",
];

export default function Ticker() {
  const row = [...items, ...items, ...items];
  return (
    <div className="ticker" aria-hidden="true">
      <div className="ticker__track">
        {row.map((item, i) => (
          <span className="ticker__item" key={`${item}-${i}`}>
            {item}
            <i>✦</i>
          </span>
        ))}
      </div>
    </div>
  );
}
