<!--
@component
A small hexagonal level badge (gold, like a game rank) showing the user's level number.
-->
<script lang="ts" module>
    let nextId = 0;
</script>

<script lang="ts">
    let {level, class: klass = "size-9"}: {level: number; class?: string} = $props();

    const gradientId = `level-grad-${nextId++}`;
</script>

<div class="relative inline-flex shrink-0 items-center justify-center {klass}" role="img" aria-label="Level {level}">
    <svg viewBox="0 0 48 48" class="size-full drop-shadow-sm" aria-hidden="true">
        <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#fde047" />
                <stop offset="100%" stop-color="#f59e0b" />
            </linearGradient>
        </defs>
        <polygon
            points="24,2.5 43.5,13.75 43.5,34.25 24,45.5 4.5,34.25 4.5,13.75"
            fill="url(#{gradientId})"
            stroke="#d97706"
            stroke-width="2.5"
            stroke-linejoin="round"
        />
    </svg>
    <span class="absolute text-[0.7em] font-extrabold text-white" style="text-shadow: 0 1px 1px rgba(0,0,0,0.35)">{level}</span>
</div>
