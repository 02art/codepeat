<!--
@component
Profile-picture chooser. Shows the avatar pool inside a rounded card (like the
confirmation dialogs) as round tiles, three per row, so all are visible at a glance.
Hovering lifts, zooms and rings a tile; clicking one selects it as the new picture.
-->
<script lang="ts">
    import {loadAvatars} from "../../../services/user/avatars.js";
    import Icon from "../../basic/Icon.svelte";
    import Modal from "../../basic/Modal.svelte";

    interface Props {
        open: boolean;
        current?: string | null;
        onSelect: (avatar: string) => void;
        onClose: () => void;
    }

    let {open, current = null, onSelect, onClose}: Props = $props();

    let avatars = $state<string[]>([]);
    let loaded = $state(false);

    // Load the pool the first time the picker opens.
    $effect(() => {
        if (open && !loaded) {
            void loadAvatars().then((list) => {
                avatars = list;
                loaded = true;
            });
        }
    });

    function choose(avatar: string): void {
        onSelect(avatar);
        onClose();
    }
</script>

<Modal {open} title="" {onClose} boxClass="max-w-md">
    <h3 class="-mt-2 mb-6 text-center text-xl font-bold">Profilbild wählen</h3>
    {#if loaded && avatars.length === 0}
        <p class="text-base-content/60 py-4 text-center text-sm">Aktuell sind keine Profilbilder verfügbar.</p>
    {/if}
    <div class="grid grid-cols-3 gap-7">
        {#each avatars as avatar (avatar)}
            <button
                type="button"
                class="group ring-offset-base-100 hover:ring-primary focus-visible:ring-primary relative aspect-square w-full overflow-hidden rounded-full ring-2 ring-transparent ring-offset-2 transition-all duration-200 ease-out hover:-translate-y-1 hover:scale-105 hover:shadow-xl focus-visible:outline-none"
                class:ring-primary={current === avatar}
                aria-label="Dieses Profilbild wählen"
                aria-pressed={current === avatar}
                onclick={() => choose(avatar)}
            >
                <img src={avatar} alt="" class="size-full object-cover transition-transform duration-300 ease-out group-hover:scale-110" />
                {#if current === avatar}
                    <span class="bg-primary text-primary-content absolute right-0.5 bottom-0.5 flex size-6 items-center justify-center rounded-full shadow">
                        <Icon name="check" class="size-3.5" />
                    </span>
                {/if}
            </button>
        {/each}
    </div>
</Modal>
