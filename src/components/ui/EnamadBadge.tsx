'use client'

const ENAMAD_SNIPPET = `<a referrerpolicy='origin' target='_blank' href='https://trustseal.enamad.ir/?id=670882&Code=QkSOxjb2f3WjiykWSHrVurS9Ab9nySbA'><img referrerpolicy='origin' src='https://trustseal.enamad.ir/logo.aspx?id=670882&Code=QkSOxjb2f3WjiykWSHrVurS9Ab9nySbA' alt='' style='cursor:pointer' code='QkSOxjb2f3WjiykWSHrVurS9Ab9nySbA'></a>`;

export default function EnamadBadge() {
    return (
        <div
            className="fixed bottom-4 left-4 z-50 flex items-center justify-center rounded-lg border border-gray-200 bg-white/90 p-2 shadow-lg backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/90"
            dangerouslySetInnerHTML={{ __html: ENAMAD_SNIPPET }}
        />
    );
}

