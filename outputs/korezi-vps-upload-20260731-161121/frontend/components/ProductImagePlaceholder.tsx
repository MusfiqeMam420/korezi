"use client";

export default function ProductImagePlaceholder({
  className = "",
  pulse = false,
}: {
  className?: string;
  pulse?: boolean;
}) {
  return (
    <div className={["grid h-full w-full place-items-center bg-white", className].join(" ")}>
      <img
        src="/product-placeholder.png"
        alt=""
        className={["h-full w-full object-cover", pulse ? "animate-pulse" : ""].join(" ")}
        draggable={false}
      />
    </div>
  );
}
