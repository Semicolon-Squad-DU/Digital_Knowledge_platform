import React from 'react';

export default function RepositoryVault() {
    return (
        <div className="flex flex-col h-screen overflow-hidden bg-[#09090b] text-[#fafafa] font-sans">
            
{/* TopNavBar */}
<nav className="bg-surface border-b border-outline-variant flex justify-between items-center w-full px-6 h-16 max-w-full z-10 shrink-0">
<div className="flex items-center gap-8 h-full">
<span className="text-xl font-headline font-black tracking-tighter text-on-surface">DKP // University Archive</span>
<div className="hidden md:flex h-full font-body text-label-sm tracking-tight gap-6">
<a className="flex items-center h-full text-primary border-b-2 border-primary pb-1 scale-95 duration-100 hover:bg-surface-container-highest transition-colors px-2" href="#">Repository</a>
<a className="flex items-center h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors px-2" href="#">Insights</a>
<a className="flex items-center h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors px-2" href="#">Commits</a>
<a className="flex items-center h-full text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors px-2" href="#">Wiki</a>
</div>
</div>
<div className="flex items-center gap-4">
<div className="relative hidden sm:block">
<span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
<input className="bg-surface-container border border-outline-variant rounded-full py-1.5 pl-9 pr-4 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent placeholder:text-on-surface-variant w-48 lg:w-64" placeholder="Search archive..." type="text" />
</div>
<button className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-2 rounded-full transition-colors">
<span className="material-symbols-outlined">notifications</span>
</button>
<button className="text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest p-2 rounded-full transition-colors">
<span className="material-symbols-outlined">settings</span>
</button>
<img alt="University Admin Profile" className="w-8 h-8 rounded-full border border-outline-variant ml-2" data-alt="A close up portrait of an academic administrator in a modern office. The lighting is moody and cinematic, matching the dark Obsidian aesthetic with subtle violet and emerald accent lights in the background. High contrast black and white with subtle color." src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh88MlAQfNuBsoY-sSKCjmpR6bYmTUdag8Qc7bsVO4k1YuH-_3O3nqpbPpLhuWrRGmAWoW5QoD72EUyLyB5QgCCUKZpPS7SJTrenZ0fTz4WICX6wS1fcZ02-G-zpvZoyIFcuFeWbQ1cIMOEuAo66_MFzAjnSt-SqW3jAuZm_VlnonG_OtXipALTsil5XlQC0yE_EaLthpMzLqn8QetlMT6dUui0rqjWdydF4t8NvurdJ2vh4HlDQ22kCm9JNZu9sF-jVFXN5nwWSSZ" />
</div>
</nav>
<div className="flex flex-1 overflow-hidden">
{/* SideNavBar */}
<aside className="bg-surface-container border-r border-outline-variant docked left-0 h-full w-64 flex flex-col p-4 gap-2 shrink-0 hidden md:flex">
<div className="mb-4 px-2">
<div className="flex items-center gap-3 mb-1">
<div className="w-8 h-8 rounded bg-primary-container flex items-center justify-center text-on-primary-container">
<span className="material-symbols-outlined text-sm">archive</span>
</div>
<div>
<h2 className="text-lg font-headline font-bold text-on-surface leading-none">File Tree</h2>
<span className="text-xs text-on-surface-variant">v2.4.0-stable</span>
</div>
</div>
</div>
<button className="w-full bg-primary text-on-primary rounded font-bold py-2 mb-4 hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
<span className="material-symbols-outlined text-sm" data-weight="fill">add</span> New Entry
            </button>
<nav className="flex-1 overflow-y-auto space-y-1 font-body text-label-md">
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">folder_open</span> Root Directory
                </a>
<a className="flex items-center gap-3 px-3 py-2 bg-secondary-container text-primary rounded-lg font-bold translate-x-1 transition-transform" href="#">
<span className="material-symbols-outlined text-lg">description</span> Academic Papers
                </a>
{/* Tree Expansion */}
<div className="pl-8 space-y-1 mt-1 mb-2 border-l border-outline-variant ml-4">
<a className="flex items-center gap-2 px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-sm transition-colors" href="#">
<span className="material-symbols-outlined text-base">folder</span> 2024
                    </a>
<a className="flex items-center gap-2 px-2 py-1.5 text-primary text-sm font-bold bg-surface-variant rounded" href="#">
<span className="material-symbols-outlined text-base">folder_open</span> 2023
                    </a>
<a className="flex items-center gap-2 px-2 py-1.5 text-on-surface-variant hover:text-on-surface text-sm transition-colors" href="#">
<span className="material-symbols-outlined text-base">folder</span> 2022
                    </a>
</div>
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">school</span> Lecture Notes
                </a>
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">biotech</span> Research Labs
                </a>
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">history</span> Legacy Archive
                </a>
</nav>
<div className="mt-auto border-t border-outline-variant pt-2 space-y-1 font-body text-label-md">
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">help</span> Help
                </a>
<a className="flex items-center gap-3 px-3 py-2 text-on-surface-variant hover:bg-surface-variant rounded transition-colors" href="#">
<span className="material-symbols-outlined text-lg">menu_book</span> Documentation
                </a>
</div>
</aside>
{/* Main Content Canvas */}
<main className="flex-1 overflow-y-auto bg-background relative">
<div className="max-w-6xl mx-auto p-8 flex flex-col xl:flex-row gap-8">
{/* Left: List */}
<div className="flex-1 xl:w-1/3 xl:flex-none">
<header className="mb-8 border-b-2 border-on-surface pb-4">
<h1 className="text-4xl font-headline font-black tracking-tighter uppercase mb-2">2023 Archives</h1>
<p className="text-on-surface-variant font-mono text-sm tracking-tight">Index / Academic Papers / 2023 / All Entries</p>
</header>
<div className="space-y-0">
{/* Article Item 1 (Active) */}
<div className="py-6 border-b border-outline-variant relative group">
<div className="absolute -left-4 top-1/2 -translate-y-1/2 w-1 h-12 bg-primary rounded-r"></div>
<div className="flex justify-between items-start mb-2">
<span className="font-mono text-xs text-primary uppercase tracking-wider">Historical Linguistics</span>
<span className="font-mono text-xs text-on-surface-variant">DOC-094</span>
</div>
<h3 className="text-xl font-bold leading-tight mb-3 cursor-pointer text-primary">The 1952 Language Movement: Sociopolitical Repercussions in Modern Bengali Syntax</h3>
<div className="flex items-center justify-between mt-4">
<div className="flex -space-x-2">
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">AK</div>
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">MR</div>
</div>
<span className="text-xs text-on-surface-variant font-mono">14 Citations</span>
</div>
</div>
{/* Article Item 2 */}
<div className="py-6 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors px-4 -mx-4 cursor-pointer">
<div className="flex justify-between items-start mb-2">
<span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Quantum Computing</span>
<span className="font-mono text-xs text-on-surface-variant">DOC-112</span>
</div>
<h3 className="text-xl font-bold leading-tight mb-3 text-on-surface group-hover:text-primary transition-colors">Error Mitigation Techniques in Shallow Quantum Circuits via Extrapolation</h3>
<div className="flex items-center justify-between mt-4">
<div className="flex -space-x-2">
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">JL</div>
</div>
<span className="text-xs text-on-surface-variant font-mono">32 Citations</span>
</div>
</div>
{/* Article Item 3 */}
<div className="py-6 border-b border-outline-variant hover:bg-surface-container-lowest transition-colors px-4 -mx-4 cursor-pointer">
<div className="flex justify-between items-start mb-2">
<span className="font-mono text-xs text-on-surface-variant uppercase tracking-wider">Bioethics</span>
<span className="font-mono text-xs text-on-surface-variant">DOC-045</span>
</div>
<h3 className="text-xl font-bold leading-tight mb-3 text-on-surface group-hover:text-primary transition-colors">CRISPR and the Commodification of Genetic Traits: A Legal Framework</h3>
<div className="flex items-center justify-between mt-4">
<div className="flex -space-x-2">
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">SW</div>
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">TR</div>
<div className="w-6 h-6 rounded-full bg-surface-container-high border border-outline-variant flex items-center justify-center text-[10px] font-bold">HP</div>
</div>
<span className="text-xs text-on-surface-variant font-mono">8 Citations</span>
</div>
</div>
</div>
</div>
{/* Right: Detail View */}
<div className="flex-1 bg-surface-container-lowest border border-outline-variant rounded-xl p-8 relative overflow-hidden">
{/* Subtle background texture */}
<div className="absolute inset-0 opacity-5 pointer-events-none" style="background-image: repeating-linear-gradient(45deg, #a78bfa 0, #a78bfa 1px, transparent 0, transparent 50%); background-size: 10px 10px;"></div>
<div className="relative z-10">
<div className="flex justify-between items-start mb-6">
<div className="flex gap-2">
<span className="px-2 py-1 bg-surface-container-high text-on-surface-variant text-xs font-mono rounded border border-outline-variant">PEER REVIEWED</span>
<span className="px-2 py-1 bg-tertiary/10 text-tertiary text-xs font-mono rounded border border-tertiary/30">OPEN ACCESS</span>
</div>
<button className="text-on-surface-variant hover:text-on-surface">
<span className="material-symbols-outlined">bookmark_add</span>
</button>
</div>
<h2 className="text-3xl md:text-4xl font-headline font-black tracking-tight leading-tight mb-6 text-on-surface">The 1952 Language Movement: Sociopolitical Repercussions in Modern Bengali Syntax</h2>
<div className="flex flex-wrap gap-6 mb-8 pb-8 border-b border-outline-variant">
<div>
<p className="text-xs font-mono text-on-surface-variant mb-1 uppercase">Authors</p>
<p className="font-medium text-sm">Dr. Amina Khatun, Prof. Mahmud Rahman</p>
</div>
<div>
<p className="text-xs font-mono text-on-surface-variant mb-1 uppercase">Published</p>
<p className="font-medium text-sm">Oct 14, 2023</p>
</div>
<div>
<p className="text-xs font-mono text-on-surface-variant mb-1 uppercase">Institution</p>
<p className="font-medium text-sm">Dept. of Linguistics</p>
</div>
<div>
<p className="text-xs font-mono text-on-surface-variant mb-1 uppercase">DOI</p>
<p className="font-mono text-primary text-sm hover:underline cursor-pointer">10.1038/s41586-023</p>
</div>
</div>
{/* Abstract Multi-column */}
<div className="mb-8">
<h3 className="text-lg font-bold mb-4 flex items-center gap-2">
<span className="material-symbols-outlined text-primary text-base">subject</span> Abstract
                            </h3>
<div className="columns-1 md:columns-2 gap-8 text-on-surface-variant text-sm leading-relaxed text-justify">
<p className="mb-4">This paper examines the enduring impact of the 1952 Language Movement in East Bengal on the morphological and syntactic structures of modern spoken and written Bengali. We argue that the sociopolitical friction of the era catalyzed an accelerated divergence from Sanskritized syntax, favoring indigenous vernacular patterns.</p>
<p className="mb-4">Through a computational analysis of 10,000 texts spanning 1947 to 2020, we identify a distinct grammatical shift that correlates directly with peaks in nationalistic sentiment. The study highlights how political resistance can fundamentally alter the structural trajectory of a language within a single generation.</p>
<p>Furthermore, we document the emergence of 'resistance morphology'—specific prefixes and suffixes that gained prominence as markers of linguistic identity, offering a novel framework for understanding the intersection of historical trauma and language evolution.</p>
</div>
</div>
{/* Action Buttons */}
<div className="flex flex-col sm:flex-row gap-4 mt-12 bg-surface-container p-6 rounded border border-outline-variant">
<div className="flex-1">
<h4 className="font-bold mb-1">Access Full Document</h4>
<p className="text-xs text-on-surface-variant">Available in PDF and EPUB formats.</p>
</div>
<div className="flex gap-3">
<button className="px-6 py-3 bg-surface border-2 border-outline-variant text-on-surface font-bold uppercase text-sm tracking-wider hover:-translate-y-1 hover:shadow-[4px_4px_0px_#27272a] transition-all flex items-center gap-2">
<span className="material-symbols-outlined text-sm">visibility</span> Preview
                                </button>
<button className="px-6 py-3 bg-primary border-2 border-primary text-on-primary font-bold uppercase text-sm tracking-wider hover:-translate-y-1 hover:shadow-[4px_4px_0px_#a78bfa] transition-all flex items-center gap-2">
<span className="material-symbols-outlined text-sm">download</span> Download
                                </button>
</div>
</div>
</div>
</div>
</div>
{/* Footer */}
<footer className="bg-surface-container-lowest border-t-4 border-outline-variant grid grid-cols-1 md:grid-cols-4 gap-8 px-12 py-16 w-full mt-12">
<div className="md:col-span-1">
<span className="text-2xl font-headline font-black uppercase tracking-widest text-on-surface block mb-4">DKP // ARCHIVE</span>
<p className="font-headline text-body-sm leading-relaxed text-on-surface">© 2024 University Digital Knowledge Platform. All rights reserved. Precision in Darkness Engine.</p>
</div>
<div className="md:col-span-3 flex flex-wrap gap-8 justify-end">
<a className="text-on-surface-variant hover:text-primary underline font-headline text-body-sm leading-relaxed" href="#">Editorial Policy</a>
<a className="text-on-surface-variant hover:text-primary underline font-headline text-body-sm leading-relaxed" href="#">Archive Standards</a>
<a className="text-on-surface-variant hover:text-primary underline font-headline text-body-sm leading-relaxed" href="#">Open Access</a>
<a className="text-on-surface-variant hover:text-primary underline font-headline text-body-sm leading-relaxed" href="#">Terms of Research</a>
</div>
</footer>
</main>
</div>

        </div>
    );
}
