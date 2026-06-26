<!--
@component
Accessible dropdown menu. A real <button> toggle drives an aria-expanded popup,
so it behaves the same with mouse, touch and keyboard — unlike a CSS focus
dropdown. Closes on Escape, outside click and tab-out, returns focus to the
trigger, and supports Arrow/Home/End navigation across the items.

Pass the trigger contents via the `trigger` snippet and the menu items (<li>…)
as the default children.
-->
<script lang="ts" module>
    let nextId = 0;
</script>

<script lang="ts">
    import {tick} from "svelte";
    import type {Snippet} from "svelte";

    interface Props {
        /** Accessible name for the trigger (it usually holds only an icon). */
        label: string;
        triggerClass?: string;
        menuClass?: string;
        trigger: Snippet;
        children: Snippet;
    }

    let {label, triggerClass = "", menuClass = "", trigger, children}: Props = $props();

    const menuId = `dropdown-${nextId++}`;
    let open = $state(false);
    let root = $state<HTMLElement>();
    let triggerEl = $state<HTMLButtonElement>();
    let menuEl = $state<HTMLElement>();

    function items(): HTMLElement[] {
        return menuEl ? Array.from(menuEl.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")) : [];
    }

    function focusItem(index: number): void {
        const list = items();
        if (list.length > 0) {
            list[(index + list.length) % list.length]?.focus();
        }
    }

    async function openMenu(focus: "first" | "last" | "none"): Promise<void> {
        open = true;
        if (focus === "none") {
            return;
        }
        await tick();
        focusItem(focus === "first" ? 0 : -1);
    }

    function close(restoreFocus: boolean): void {
        if (!open) {
            return;
        }
        open = false;
        if (restoreFocus) {
            triggerEl?.focus();
        }
    }

    function onTriggerClick(event: MouseEvent): void {
        if (open) {
            close(false);
        } else {
            // detail === 0 means the click came from Enter/Space — step into the menu.
            void openMenu(event.detail === 0 ? "first" : "none");
        }
    }

    function onTriggerKeydown(event: KeyboardEvent): void {
        if (event.key === "ArrowDown") {
            event.preventDefault();
            void openMenu("first");
        } else if (event.key === "ArrowUp") {
            event.preventDefault();
            void openMenu("last");
        } else if (event.key === "Escape") {
            close(true);
        }
    }

    // While open, keyboard navigation and dismissal are wired from the script so
    // the menu markup stays a plain list with no handlers on non-interactive nodes.
    $effect(() => {
        if (!open || !menuEl || !root) {
            return;
        }
        const menu = menuEl;
        const container = root;

        const onKeydown = (event: KeyboardEvent): void => {
            const current = items().indexOf(document.activeElement as HTMLElement);
            switch (event.key) {
                case "ArrowDown": event.preventDefault(); focusItem(current + 1); break;
                case "ArrowUp":   event.preventDefault(); focusItem(current - 1); break;
                case "Home":      event.preventDefault(); focusItem(0);           break;
                case "End":       event.preventDefault(); focusItem(-1);          break;
                case "Escape":    close(true);                                    break;
            }
        };
        const onSelect = (): void => close(false);
        const onFocusOut = (event: FocusEvent): void => {
            if (event.relatedTarget === null || !container.contains(event.relatedTarget as Node)) {
                close(false);
            }
        };
        const onPointerDown = (event: PointerEvent): void => {
            if (!container.contains(event.target as Node)) {
                close(false);
            }
        };

        menu.addEventListener("keydown", onKeydown);
        menu.addEventListener("click", onSelect);
        container.addEventListener("focusout", onFocusOut);
        document.addEventListener("pointerdown", onPointerDown);
        return () => {
            menu.removeEventListener("keydown", onKeydown);
            menu.removeEventListener("click", onSelect);
            container.removeEventListener("focusout", onFocusOut);
            document.removeEventListener("pointerdown", onPointerDown);
        };
    });
</script>

<div bind:this={root} class="relative">
    <button
        bind:this={triggerEl}
        type="button"
        aria-label={label}
        aria-haspopup="true"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        class={triggerClass}
        onclick={onTriggerClick}
        onkeydown={onTriggerKeydown}
    >
        {@render trigger()}
    </button>

    {#if open}
        <ul bind:this={menuEl} id={menuId} class="absolute z-30 {menuClass}">
            {@render children()}
        </ul>
    {/if}
</div>
