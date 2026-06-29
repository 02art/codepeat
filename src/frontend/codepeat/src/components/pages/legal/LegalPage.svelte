<!--
@component
Static legal page holding both the privacy policy (Datenschutzerklärung) and the
imprint (Impressum). The footer links here: "Datenschutz" opens the top, "Impressum"
passes `section="impressum"` so we scroll straight to the imprint anchor.
-->
<script lang="ts">
    let {section}: {section?: string} = $props();

    const contact = {
        name: "Duale Hochschule Baden-Württemberg Karlsruhe",
        street: "Erzbergerstraße 121",
        city: "76133 Karlsruhe",
        country: "Deutschland",
        email: "info@dhbw-karlsruhe.de",
    };

    // Scroll to the requested section once the page has rendered.
    $effect(() => {
        if (section === undefined || section === "") {
            return;
        }
        const target = document.getElementById(section);
        requestAnimationFrame(() => target?.scrollIntoView({behavior: "smooth", block: "start"}));
    });
</script>

<div class="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6">
    <article class="text-base-content/80 flex flex-col gap-8 leading-relaxed">
        <h1 class="text-base-content text-center text-3xl font-bold sm:text-4xl">Datenschutzerklärung</h1>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">1. Allgemeine Hinweise</h2>
            <p>
                Der Schutz deiner personenbezogenen Daten ist uns wichtig. In dieser Datenschutzerklärung
                erfährst du, welche Daten wir erheben, wie wir sie verarbeiten und wofür wir sie nutzen.
            </p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">2. Verantwortliche Stelle</h2>
            <p>Verantwortlich für die Datenverarbeitung im Sinne der Datenschutz-Grundverordnung (DSGVO) ist:</p>
            <p>CodePeat</p>
            <address class="not-italic">
                {contact.name}<br />
                {contact.street}<br />
                {contact.city}<br />
                {contact.country}<br />
                E-Mail: {contact.email}
            </address>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">3. Welche Daten wir speichern</h2>
            <p>Wenn du ein Nutzerkonto bei CodePeat erstellst, speichern wir folgende personenbezogene Daten:</p>
            <ul class="list-disc pl-6">
                <li>Benutzername</li>
                <li>E-Mail-Adresse</li>
                <li>Passwort (ausschließlich verschlüsselt/gehasht)</li>
            </ul>
            <p>Diese Daten benötigen wir, um dir einen Login und ein persönliches Nutzerkonto bereitzustellen.</p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">4. Hochladen und Verarbeiten von Code</h2>
            <p>Auf CodePeat kannst du Programmcode hochladen, um ihn automatisch bewerten zu lassen.</p>
            <ul class="list-disc pl-6">
                <li>Dein hochgeladener Code wird ausschließlich zur Analyse und Bewertung verwendet.</li>
                <li>Die Verarbeitung erfolgt über ein selbstgehostetes KI-Modell innerhalb der bwCloud, einer Cloud-Infrastruktur für Hochschulen in Baden-Württemberg.</li>
                <li>Nach der Verarbeitung wird dein hochgeladener Code vollständig gelöscht.</li>
                <li>Es wird kein Quellcode dauerhaft gespeichert.</li>
                <li>Gespeichert wird nur das personalisierte Feedback, das deinem Nutzerkonto zugeordnet ist.</li>
            </ul>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">5. Serverstandort und Datenverarbeitung</h2>
            <p>Alle Daten werden ausschließlich auf Servern innerhalb der bwCloud-Infrastruktur in Deutschland verarbeitet und gespeichert.</p>
            <p>Eine Weitergabe deiner personenbezogenen Daten an Dritte findet nicht statt.</p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">6. Wofür wir deine Daten nutzen</h2>
            <p>Wir verarbeiten deine Daten zu folgenden Zwecken:</p>
            <ul class="list-disc pl-6">
                <li>Bereitstellung und Verwaltung deines Nutzerkontos</li>
                <li>Durchführung der automatisierten Codebewertung</li>
                <li>Speicherung und Anzeige deines persönlichen Feedbacks</li>
                <li>Sicherstellung des technischen Betriebs von CodePeat</li>
            </ul>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">7. Rechtsgrundlage</h2>
            <p>
                Die Verarbeitung deiner personenbezogenen Daten erfolgt gemäß Art. 6 Abs. 1 lit. b DSGVO,
                da sie für die Nutzung unserer Plattform erforderlich ist.
            </p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">8. Speicherdauer</h2>
            <ul class="list-disc pl-6">
                <li>Deine Kontodaten speichern wir, solange dein Nutzerkonto besteht.</li>
                <li>Hochgeladener Code wird nach der Analyse gelöscht.</li>
                <li>Feedback wird gespeichert, bis du dein Nutzerkonto löschst oder die Löschung verlangst.</li>
            </ul>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">9. Deine Rechte</h2>
            <p>Du hast jederzeit das Recht auf:</p>
            <ul class="list-disc pl-6">
                <li>Auskunft über deine gespeicherten Daten</li>
                <li>Berichtigung unrichtiger Daten</li>
                <li>Löschung deiner Daten</li>
                <li>Einschränkung der Verarbeitung</li>
                <li>Widerspruch gegen die Verarbeitung</li>
                <li>Datenübertragbarkeit</li>
            </ul>
            <p>Wende dich dafür einfach an die oben genannte verantwortliche Stelle.</p>
        </section>

        <section class="flex flex-col gap-2">
            <h2 class="text-base-content text-xl font-bold">10. Änderungen</h2>
            <p>
                Wir behalten uns vor, diese Datenschutzerklärung anzupassen, wenn sich rechtliche Vorgaben
                oder unser Angebot ändern.
            </p>
        </section>

        <section id="impressum" class="mt-8 flex scroll-mt-28 flex-col items-center gap-2 border-t pt-12 text-center">
            <h2 class="text-base-content text-3xl font-bold sm:text-4xl">Impressum</h2>
            <address class="not-italic">
                {contact.name}<br />
                {contact.street}<br />
                {contact.city}<br />
                {contact.country}<br />
                E-Mail: {contact.email}
            </address>
        </section>
    </article>
</div>
