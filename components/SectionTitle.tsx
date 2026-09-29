// Título de sección: mayúsculas, extra-negrita, subrayado grueso verde (firma visual "LAS 5 DEL DÍA")
import type { ReactNode } from "react";

interface Props {
  title: string;
  id?: string;
  subtitle?: string;
  right?: ReactNode;
  as?: "h1" | "h2" | "h3";
}

export default function SectionTitle({ title, id, subtitle, right, as: Tag = "h2" }: Props) {
  const grande = Tag === "h1";
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <Tag
          id={id}
          className={
            grande
              ? "inline-block font-serif text-5xl uppercase leading-none tracking-tight text-tinta sm:text-6xl"
              : "inline-block text-2xl font-extrabold uppercase leading-tight tracking-tight text-tinta sm:text-3xl"
          }
        >
          {title}
          <span aria-hidden="true" className={`mt-2 block rounded-sm bg-oliva ${grande ? "h-2" : "h-1.5"}`} />
        </Tag>
        {subtitle && <p className="mt-3 max-w-2xl text-sm text-tinta/65">{subtitle}</p>}
      </div>
      {right}
    </div>
  );
}
