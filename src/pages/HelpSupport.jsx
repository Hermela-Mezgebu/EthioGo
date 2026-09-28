// src/pages/HelpSupport.jsx

import React, { useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  CircleHelp,
  Clock3,
  ExternalLink,
  FileQuestion,
  Mail,
  MessageCircle,
  Moon,
  Plane,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  Sun,
  Ticket,
  Wifi,
  X,
} from "lucide-react";

import Sidebar from "../components/layout/Sidebar";
import { useTheme } from "../context/ThemeContext";

const FAQS = [
  {
    category: "Getting Started",
    question: "How do I search for a flight?",
    answer:
      "Open Flight Search from the sidebar. You can search using a flight number, airline, departure airport, arrival airport, or other available flight information.",
  },
  {
    category: "Live Flights",
    question: "How often is live flight information updated?",
    answer:
      "The dashboard refreshes live flight information periodically from the AviationStack service. The latest successful update time is shown on pages that use live flight data.",
  },
  {
    category: "Live Flights",
    question: "Why can't I see live telemetry for some flights?",
    answer:
      "Live telemetry depends on the information returned by the flight-data provider. Some flights may not include altitude, speed, heading, coordinates, or other live fields.",
  },
  {
    category: "Favorites",
    question: "How can I monitor a flight?",
    answer:
      "Use the monitoring or favorite action available on a flight card. Monitored flights can then be accessed from the Favorites section.",
  },
  {
    category: "Account",
    question: "How do I change my account settings?",
    answer:
      "Open Settings from the sidebar. Account and application preferences can be managed from the available settings sections.",
  },
  {
    category: "Notifications",
    question: "Why am I not receiving notifications?",
    answer:
      "Check your notification preferences and make sure the required notification options are enabled. Browser notification permissions may also affect notifications.",
  },
  {
    category: "Troubleshooting",
    question: "What should I do if flight data is unavailable?",
    answer:
      "First check your internet connection and the AviationStack connection status. If the problem continues, refresh the page and contact support with the error message you received.",
  },
  {
    category: "Troubleshooting",
    question: "Why is the dashboard loading slowly?",
    answer:
      "Dashboard performance can depend on your network connection and the availability of external flight-data services. Try refreshing the page and checking whether the service status indicates an issue.",
  },
];

const CATEGORIES = [
  {
    title: "Getting Started",
    description: "Learn the basics of using EthioFlight.",
    icon: BookOpen,
  },
  {
    title: "Live Flights",
    description: "Help with live flight tracking and telemetry.",
    icon: Activity,
  },
  {
    title: "Flight Search",
    description: "Find flights, airports, and airlines.",
    icon: Search,
  },
  {
    title: "Favorites",
    description: "Manage flights you want to monitor.",
    icon: Plane,
  },
  {
    title: "Notifications",
    description: "Configure alerts and notification settings.",
    icon: Bell,
  },
  {
    title: "Account & Settings",
    description: "Manage preferences and application settings.",
    icon: Settings,
  },
];

function StatusIndicator({ status, children }) {
  const styles = {
    operational: "bg-success/10 text-success border-success/30",
    warning: "bg-warning/10 text-warning border-warning/30",
    unavailable: "bg-danger/10 text-danger border-danger/30",
  };

  const dots = {
    operational: "bg-success",
    warning: "bg-warning",
    unavailable: "bg-danger",
  };

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
        styles[status] || styles.operational
      }`}
    >
      <span
        className={`h-2 w-2 rounded-full ${
          dots[status] || dots.operational
        }`}
      />
      {children}
    </div>
  );
}

function FAQItem({ faq, isOpen, onToggle }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-background"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
            <CircleHelp size={17} />
          </div>

          <div className="min-w-0">
            <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wider text-neutral-muted">
              {faq.category}
            </span>

            <span className="block text-sm font-semibold text-neutral">
              {faq.question}
            </span>
          </div>
        </div>

        <ChevronDown
          size={18}
          className={`shrink-0 text-neutral-muted transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <div className="border-t border-divider px-5 pb-5 pt-4">
          <p className="pl-11 text-sm leading-6 text-neutral-light">
            {faq.answer}
          </p>
        </div>
      )}
    </div>
  );
}

export default function HelpSupport() {
  const { theme, toggleTheme } = useTheme();

  const [searchQuery, setSearchQuery] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showContactForm, setShowContactForm] = useState(false);

  const filteredFaqs = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return FAQS.filter((faq) => {
      const matchesCategory =
        selectedCategory === "All" || faq.category === selectedCategory;

      const matchesSearch =
        !query ||
        faq.question.toLowerCase().includes(query) ||
        faq.answer.toLowerCase().includes(query) ||
        faq.category.toLowerCase().includes(query);

      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory]);

  const categories = ["All", ...new Set(FAQS.map((faq) => faq.category))];

  return (
    <div className="min-h-screen bg-background text-neutral">
      {/* Reusable Sidebar */}
      <Sidebar activeItem="Help & Support" />

      {/* Main application area */}
      <div className="min-h-screen lg:pl-[5px]">
        {/* Header */}
        <header className="fixed left-0 right-0 top-0 z-40 h-[72px] border-b border-border bg-surface lg:left-[240px]">
          <div className="flex h-full items-center justify-between gap-4 px-4 md:px-6 lg:px-8">
            {/* Breadcrumb */}
            <div className="hidden items-center gap-3 text-xs font-semibold md:flex">
              <CircleHelp size={17} className="text-neutral-muted" />

              <span className="text-neutral-muted">Operations</span>

              <span className="text-neutral-muted">/</span>

              <span className="text-neutral">Help &amp; Support</span>
            </div>

            {/* Header Search */}
            <div className="relative ml-auto hidden w-[300px] lg:block xl:w-[360px]">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-muted"
              />

              <input
                type="text"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search help..."
                className="h-10 w-full rounded-xl border border-border bg-background pl-10 pr-4 text-sm text-neutral outline-none transition-all placeholder:text-neutral-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
              />
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-2 md:gap-3">
              <StatusIndicator status="operational">
                <span className="hidden sm:inline">System Operational</span>
                <span className="sm:hidden">Online</span>
              </StatusIndicator>

              <button
                type="button"
                title="Notifications"
                className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
              >
                <Bell size={20} />
              </button>

              <button
                type="button"
                onClick={toggleTheme}
                title={
                  theme === "dark"
                    ? "Switch to light theme"
                    : "Switch to dark theme"
                }
                aria-label="Toggle theme"
                className="rounded-xl p-2 text-neutral-light transition-colors hover:bg-background hover:text-neutral"
              >
                {theme === "dark" ? (
                  <Sun size={20} />
                ) : (
                  <Moon size={20} />
                )}
              </button>

              <div className="hidden h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-white sm:flex">
                H
              </div>
            </div>
          </div>
        </header>

        {/* Page */}
        <main className="min-h-screen bg-background ">
          <div className="w-full px-4 py-6 md:px-6 lg:px-8 lg:py-8">
            <div className="mx-auto w-full max-w-[1440px]">
              {/* Hero */}
              <section className="mb-8 overflow-hidden rounded-2xl border border-border bg-surface">
                <div className="relative p-6 md:p-8 lg:p-10">
                  <div className="absolute right-0 top-0 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
                  <div className="absolute bottom-0 right-32 h-32 w-32 rounded-full bg-secondary/5 blur-3xl" />

                  <div className="relative max-w-3xl">
                    <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-light px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary">
                      <Sparkles size={14} />
                      Support Center
                    </div>

                    <h1 className="text-3xl font-bold tracking-tight text-neutral md:text-4xl">
                      How can we help?
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-light md:text-base">
                      Find answers, learn how to use EthioFlight, troubleshoot
                      common problems, or contact the support team when you
                      need additional assistance.
                    </p>

                    {/* Main Help Search */}
                    <div className="relative mt-7 max-w-2xl">
                      <Search
                        size={20}
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-muted"
                      />

                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(event) =>
                          setSearchQuery(event.target.value)
                        }
                        placeholder="Search questions, features, or problems..."
                        className="h-14 w-full rounded-xl border border-border bg-background pl-12 pr-12 text-sm text-neutral outline-none transition-all placeholder:text-neutral-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                      />

                      {searchQuery && (
                        <button
                          type="button"
                          onClick={() => setSearchQuery("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-neutral-muted hover:bg-surface hover:text-neutral"
                        >
                          <X size={17} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </section>

              {/* Quick support cards */}
              <section className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
                <button
                  type="button"
                  onClick={() => setShowContactForm(true)}
                  className="group rounded-2xl border border-border bg-surface p-5 text-left transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
                >
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary">
                    <MessageCircle size={21} />
                  </div>

                  <div className="flex items-center justify-between">
                    <h2 className="font-semibold text-neutral">
                      Contact Support
                    </h2>
                    <ChevronRight
                      size={18}
                      className="text-neutral-muted transition-transform group-hover:translate-x-1"
                    />
                  </div>

                  <p className="mt-2 text-sm leading-5 text-neutral-light">
                    Send a support request when you need direct assistance.
                  </p>
                </button>

                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-secondary-light text-secondary">
                    <Clock3 size={21} />
                  </div>

                  <h2 className="font-semibold text-neutral">
                    Support Hours
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-neutral-light">
                    Support availability depends on the configured support
                    schedule for your organization.
                  </p>
                </div>

                <div className="rounded-2xl border border-border bg-surface p-5">
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-info/10 text-info">
                    <FileQuestion size={21} />
                  </div>

                  <h2 className="font-semibold text-neutral">
                    Documentation
                  </h2>

                  <p className="mt-2 text-sm leading-5 text-neutral-light">
                    Review guides and frequently asked questions below.
                  </p>
                </div>
              </section>

              {/* Categories */}
              <section className="mb-8">
                <div className="mb-4 flex items-end justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-neutral">
                      Browse Help Topics
                    </h2>
                    <p className="mt-1 text-sm text-neutral-light">
                      Choose an area to find relevant support information.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {CATEGORIES.map((category) => {
                    const Icon = category.icon;

                    return (
                      <button
                        key={category.title}
                        type="button"
                        onClick={() => {
                          setSelectedCategory(category.title);
                          document
                            .getElementById("faq-section")
                            ?.scrollIntoView({
                              behavior: "smooth",
                              block: "start",
                            });
                        }}
                        className="group flex items-center gap-4 rounded-xl border border-border bg-surface p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-sm"
                      >
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                          <Icon size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-neutral">
                            {category.title}
                          </h3>

                          <p className="mt-1 text-xs leading-5 text-neutral-light">
                            {category.description}
                          </p>
                        </div>

                        <ChevronRight
                          size={18}
                          className="shrink-0 text-neutral-muted transition-transform group-hover:translate-x-1"
                        />
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* FAQ */}
              <section id="faq-section" className="scroll-mt-24">
                <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
                  <div>
                    <div className="mb-5">
                      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                          <h2 className="text-xl font-bold text-neutral">
                            Frequently Asked Questions
                          </h2>

                          <p className="mt-1 text-sm text-neutral-light">
                            Find quick answers to common EthioFlight
                            questions.
                          </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          {categories.map((category) => (
                            <button
                              key={category}
                              type="button"
                              onClick={() => setSelectedCategory(category)}
                              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                                selectedCategory === category
                                  ? "bg-primary text-white"
                                  : "bg-surface text-neutral-light hover:bg-primary-light hover:text-primary"
                              }`}
                            >
                              {category}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {filteredFaqs.length > 0 ? (
                      <div className="space-y-3">
                        {filteredFaqs.map((faq, index) => (
                          <FAQItem
                            key={`${faq.question}-${index}`}
                            faq={faq}
                            isOpen={openFaq === index}
                            onToggle={() =>
                              setOpenFaq(openFaq === index ? null : index)
                            }
                          />
                        ))}
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-background text-neutral-muted">
                          <Search size={22} />
                        </div>

                        <h3 className="mt-4 font-semibold text-neutral">
                          No help articles found
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-light">
                          Try a different search term or select another help
                          category.
                        </p>

                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("All");
                          }}
                          className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                        >
                          Clear Filters
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Right Support Panel */}
                  <aside className="space-y-4">
                    {/* System status */}
                    <div className="rounded-2xl border border-border bg-surface p-5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success/10 text-success">
                            <ShieldCheck size={20} />
                          </div>

                          <div>
                            <h3 className="font-semibold text-neutral">
                              System Status
                            </h3>
                            <p className="text-xs text-neutral-muted">
                              Current service availability
                            </p>
                          </div>
                        </div>

                        <CheckCircle2
                          size={19}
                          className="text-success"
                        />
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-2">
                            <Wifi size={15} className="text-neutral-muted" />
                            <span className="text-sm text-neutral">
                              Dashboard
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-success">
                            Operational
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-2">
                            <Activity
                              size={15}
                              className="text-neutral-muted"
                            />
                            <span className="text-sm text-neutral">
                              Flight Data
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-success">
                            Connected
                          </span>
                        </div>

                        <div className="flex items-center justify-between rounded-lg bg-background p-3">
                          <div className="flex items-center gap-2">
                            <Bell
                              size={15}
                              className="text-neutral-muted"
                            />
                            <span className="text-sm text-neutral">
                              Notifications
                            </span>
                          </div>

                          <span className="text-xs font-semibold text-success">
                            Available
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Contact card */}
                    <div className="rounded-2xl border border-border bg-primary p-5 text-white">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
                        <Mail size={20} />
                      </div>

                      <h3 className="mt-4 font-semibold">
                        Still need help?
                      </h3>

                      <p className="mt-2 text-sm leading-5 text-white/75">
                        If the FAQ does not answer your question, send us a
                        support request.
                      </p>

                      <button
                        type="button"
                        onClick={() => setShowContactForm(true)}
                        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-white/90"
                      >
                        Contact Support
                        <ChevronRight size={16} />
                      </button>
                    </div>

                    {/* Quick links */}
                    <div className="rounded-2xl border border-border bg-surface p-5">
                      <h3 className="font-semibold text-neutral">
                        Quick Links
                      </h3>

                      <div className="mt-3 space-y-1">
                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-neutral-light transition-colors hover:bg-background hover:text-neutral"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen size={16} />
                            User Guide
                          </span>
                          <ExternalLink size={14} />
                        </button>

                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-neutral-light transition-colors hover:bg-background hover:text-neutral"
                        >
                          <span className="flex items-center gap-2">
                            <Ticket size={16} />
                            Support Requests
                          </span>
                          <ChevronRight size={14} />
                        </button>

                        <button
                          type="button"
                          className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm text-neutral-light transition-colors hover:bg-background hover:text-neutral"
                        >
                          <span className="flex items-center gap-2">
                            <Settings size={16} />
                            Settings
                          </span>
                          <ChevronRight size={14} />
                        </button>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>

              {/* Bottom Contact Banner */}
              <section className="mt-8 rounded-2xl border border-border bg-surface p-6 md:p-8">
                <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-secondary-light text-secondary">
                      <MessageCircle size={22} />
                    </div>

                    <div>
                      <h2 className="font-bold text-neutral">
                        Didn't find what you were looking for?
                      </h2>

                      <p className="mt-1 max-w-2xl text-sm leading-5 text-neutral-light">
                        Our support team can help you troubleshoot problems
                        and answer questions about using the EthioFlight
                        dashboard.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowContactForm(true)}
                    className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    <Send size={17} />
                    Send a Request
                  </button>
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      {/* Contact Support Modal */}
      {showContactForm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-divider px-5 py-4">
              <div>
                <h2 className="font-bold text-neutral">
                  Contact Support
                </h2>

                <p className="mt-0.5 text-xs text-neutral-muted">
                  Tell us what you need help with.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowContactForm(false)}
                className="rounded-lg p-2 text-neutral-muted hover:bg-background hover:text-neutral"
              >
                <X size={18} />
              </button>
            </div>

            <form
              onSubmit={(event) => {
                event.preventDefault();
                setShowContactForm(false);
              }}
              className="space-y-4 p-5"
            >
              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral">
                  Subject
                </label>

                <input
                  type="text"
                  required
                  placeholder="What do you need help with?"
                  className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-neutral outline-none placeholder:text-neutral-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral">
                  Category
                </label>

                <select className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-neutral outline-none focus:border-primary focus:ring-4 focus:ring-primary/10">
                  <option>Flight Search</option>
                  <option>Live Flights</option>
                  <option>Favorites</option>
                  <option>Notifications</option>
                  <option>Account & Settings</option>
                  <option>Technical Problem</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-semibold text-neutral">
                  Description
                </label>

                <textarea
                  required
                  rows={5}
                  placeholder="Describe the problem or question..."
                  className="w-full resize-none rounded-xl border border-border bg-background px-3 py-2.5 text-sm text-neutral outline-none placeholder:text-neutral-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowContactForm(false)}
                  className="rounded-xl bg-background px-4 py-2.5 text-sm font-semibold text-neutral transition-colors hover:bg-border"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-primary-dark"
                >
                  <Send size={16} />
                  Submit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}