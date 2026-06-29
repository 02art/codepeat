<!--
@component
Public landing page shown at the root route and when clicking the CodePeat logo:
a hero panel introducing the product and a "by students, for students" banner.
-->
<script lang="ts">
    import {currentUser} from "../../../services/user/user.store.js";

    // Signed-in visitors jump straight into the challenges; guests are funnelled to sign-up.
    const startHref = $derived($currentUser !== null ? "#/challenges" : "#/register");
    const startLabel = $derived($currentUser !== null ? "Los geht's" : "Jetzt Anfangen");
</script>

<div class="relative mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 sm:py-16">
    <img src="arrow-round.png" alt="" aria-hidden="true" class="pointer-events-none absolute right-0 bottom-32 hidden w-56 select-none lg:block xl:w-64" />

    <section class="bg-base-100 relative rounded-3xl p-8 shadow-sm sm:p-12 lg:p-16">
        <div class="grid items-center gap-10 lg:grid-cols-2">
            <div class="flex flex-col gap-6">
                <h1 class="text-4xl leading-tight font-extrabold tracking-tight sm:text-5xl xl:text-6xl">
                    Lerne den Umgang mit
                    <span class="text-primary">Künstlicher Intelligenz</span>
                </h1>
                <p class="text-base-content/60 max-w-xl text-lg">
                    Mit CodePeat kannst du spielerisch den verantwortungsvollen Umgang mit
                    Künstlicher Intelligenz lernen.
                </p>
                <div class="mt-2 flex flex-col gap-3 sm:flex-row">
                    <a href="#/challenges" class="btn btn-outline w-full rounded-full px-8 sm:w-auto">Mehr Infos</a>
                    <a href={startHref} class="btn btn-primary w-full rounded-full px-8 sm:w-auto">{startLabel}</a>
                </div>
            </div>

            <div class="flex justify-center lg:justify-end">
                <img src="hero.png" alt="Person vor einer Staffelei mit einem KI-generierten Bild" class="w-full max-w-md" />
            </div>
        </div>
    </section>

    <div class="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 text-center md:mt-32">
        <img src="greenH.png" alt="" aria-hidden="true" class="size-12" />
        <span class="text-base-content/70 text-xl font-bold">Ein Projekt von Studenten, für Studenten</span>
        <img src="dhlogo.png" alt="Duale Hochschule Baden-Württemberg" class="h-12 w-auto sm:h-14" />
    </div>
</div>
