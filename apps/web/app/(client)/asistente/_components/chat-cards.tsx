"use client";

import type { AssistantCard, AssistantFoodLine } from "@regen/types";
import { amount, macroLine, portionLabel } from "../_lib/format";

export function ChatCards({
  cards,
  busy,
  onPick,
}: {
  cards: AssistantCard[];
  busy: boolean;
  onPick: (text: string) => void;
}) {
  return (
    <>
      {cards.map((card, index) => {
        if (card.kind === "meal") {
          return (
            <article className="asistente-card" key={`meal-${index}`}>
              <div className="asistente-card-kicker">
                {card.updated ? "Actualizado" : "Sumado"}
                {card.standardPortion ? " · porción estándar" : ""}
              </div>
              <div className="asistente-card-head">
                <strong>{card.title}{card.approximate ? " · aprox." : ""}</strong>
                <em>{amount(card.totals.kcal, 0)} kcal</em>
              </div>
              {card.items.map((item) => <FoodLineView key={`${item.name}-${item.quantity}`} item={item} />)}
            </article>
          );
        }
        if (card.kind === "supplements") {
          return (
            <div className="asistente-chips" key={`supplements-${index}`}>
              {card.items.map((item) => (
                <span className="asistente-supplement-ask" key={item.id}>
                  <strong>{item.name}</strong>
                  <button type="button" disabled={busy} onClick={() => onPick(`Tomé ${item.name}`)}>Tomé</button>
                  <button type="button" disabled={busy} onClick={() => onPick(`Hoy no tomé ${item.name}`)}>Hoy no</button>
                </span>
              ))}
            </div>
          );
        }
        if (card.kind === "drinks") {
          return (
            <article className="asistente-card" key={`drinks-${index}`}>
              <div className="asistente-card-kicker">Sumado</div>
              {card.items.map((item) => (
                <div className="asistente-line" key={`${item.name}-${item.milliliters}`}>
                  <strong>{item.name}</strong>
                  <em>{amount(item.kcal, 0)} kcal</em>
                  <small>{amount(item.milliliters, 0)} ml</small>
                </div>
              ))}
            </article>
          );
        }
        if (card.kind !== "options") return null;
        return (
          <div className="asistente-options" key={`options-${index}`}>
            {card.options.map((option) => (
              <button
                key={option.title}
                type="button"
                className="asistente-option"
                disabled={busy}
                onClick={() => onPick(`Quiero ${option.title}`)}
              >
                <span>
                  <strong>{option.title}</strong>
                  <small>{option.items.map((item) => `${item.name} ${portionLabel(item)}`).join(" · ")}</small>
                </span>
                <em>{amount(option.totals.kcal, 0)} kcal</em>
                <small>{macroLine(option.totals)}</small>
              </button>
            ))}
          </div>
        );
      })}
    </>
  );
}

function FoodLineView({ item }: { item: AssistantFoodLine }) {
  return (
    <div className="asistente-line asistente-line-food">
      <strong>{item.name}</strong>
      <em>{portionLabel(item)}</em>
      <small>{macroLine(item)}</small>
    </div>
  );
}
