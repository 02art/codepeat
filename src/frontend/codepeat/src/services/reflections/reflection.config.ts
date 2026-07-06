/**
 * Predefined reflection content.
 *
 * `CODEPEAT_DEFAULTS` are always shown (up to 3) when filling in a CodePeat challenge — one per
 * answer type. `CATALOGUE` is the question bank a teacher picks from in the challenge editor.
 */

import type {CatalogueGroup, CatalogueQuestion} from "./reflection.types.js";

/** Always included (in this order) for CodePeat challenges when a student reflects. */
export const CODEPEAT_DEFAULTS: CatalogueQuestion[] = [
    {
        text: "Wofür hast du KI hauptsächlich genutzt?",
        kind: "choice",
        options: [
            "Verständnis der Aufgabe",
            "Lösungsstrategie",
            "Code generieren",
            "Fehler finden oder Debugging",
            "Erklärung von bestehendem Code",
            "Ich habe keine KI genutzt",
        ],
    },
    {text: "In welchem Umfang hast du KI genutzt?", kind: "scale", options: ["gar nicht", "sehr stark"]},
    {text: "Welcher Teil der Aufgabe war für dich am schwierigsten?", kind: "text"},
];

/** The question bank teachers select from, grouped by topic. */
export const CATALOGUE: CatalogueGroup[] = [
    {
        title: "Lösungsprozess",
        questions: [
            {text: "Wie bist du an die Aufgaben herangegangen, bevor du mit dem Programmieren gestartet hast?", kind: "text"},
            {text: "Welche Teilschritte oder Teilprobleme hast du bei der Bearbeitung identifiziert?", kind: "text"},
            {text: "Welche Lösungsansätze hast du in Betracht gezogen und warum hast du dich für den gewählten Ansatz entschieden?", kind: "text"},
            {text: "An welcher Stelle hattest du die größten Schwierigkeiten und wie hast du versucht, diese zu lösen?", kind: "text"},
            {text: "Welche Fehler oder Bugs sind während der Bearbeitung aufgetreten?", kind: "text"},
            {text: "Wie hast du überprüft, ob deine Lösung korrekt funktioniert?", kind: "text"},
            {text: "Was würdest du an deiner Lösung nachträglich verbessern oder anders umsetzen?", kind: "text"},
            {text: "Welche Kenntnisse oder Fähigkeiten waren für die Bearbeitung besonders wichtig?", kind: "text"},
            {text: "Welche neuen Erkenntnisse hast du während der Bearbeitung gewonnen?", kind: "text"},
            {text: "Wie sicher fühlst du dich, die Lösung jemand anderem erklären zu können?", kind: "scale", options: ["gar nicht sicher", "sehr sicher"]},
        ],
    },
    {
        title: "Nutzung von KI",
        questions: [
            {text: "Hast du während der Bearbeitung KI-Werkzeuge genutzt? Wenn ja, welche?", kind: "text"},
            {text: "Für welche konkreten Aufgaben hast du KI eingesetzt?", kind: "text"},
            {text: "Welche Teile der Lösung stammen direkt oder indirekt aus Vorschlägen einer KI?", kind: "text"},
            {text: "Wie hast du überprüft, ob die Vorschläge der KI korrekt und sinnvoll waren?", kind: "text"},
            {text: "Gab es Situationen, in denen die KI falsche oder unpassende Vorschläge gemacht hat?", kind: "text"},
            {text: "Wie hätte sich dein Lösungsprozess ohne KI-Unterstützung vermutlich verändert?", kind: "text"},
            {text: "Welche Vorteile hat dir die Nutzung von KI in dieser Aufgabe gebracht?", kind: "text"},
            {text: "Welche Nachteile oder Risiken siehst du bei der Nutzung von KI für solche Aufgaben?", kind: "text"},
            {text: "An welchen Stellen hast du bewusst auf KI verzichtet und warum?", kind: "text"},
            {text: "Inwiefern glaubst du, dass du die finale Lösung selbst verstanden hast?", kind: "scale", options: ["gar nicht", "vollständig"]},
        ],
    },
];
