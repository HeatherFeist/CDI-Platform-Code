import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Building2,
  CheckCircle2,
  ExternalLink,
  Filter,
  MapPin,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { isConfigured, supabase } from '../lib/supabase';

type DirectoryListing = {
  id: string;
  business_name: string;
  slug: string;
  short_description: string;
  categories: string[];
  city: string;
  state: string;
  service_area: string;
  phone: string;
  email: string;
  website_url: string;
  google_business_url: string;
  google_rating: number | null;
  google_review_count: number | null;
  facebook_page_url: string;
  facebook_rating: number | null;
  facebook_review_count: number | null;
  logo_url: string;
  cover_image_url: string;
  is_verified: boolean;
  is_featured: boolean;
  is_network_member: boolean;
  receptionist_enabled: boolean;
  booking_url: string;
  receptionist_url: string;
  listing_status: string;
};

const DIRECTORY_APPLY_URL = 'https://renovision.constructivedesignsinc.org/login';

const badgeBase =
  'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em]';

export function BusinessDirectory(): React.JSX.Element {
  const [listings, setListings] = useState<DirectoryListing[]>([]);
  const [loading, setLoading] = useState<boolean>(isConfigured);
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedCity, setSelectedCity] = useState('All');
  const [showVerifiedOnly, setShowVerifiedOnly] = useState(false);
  const [showReceptionistOnly, setShowReceptionistOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const loadListings = async () => {
      if (!isConfigured) {
        setLoading(false);
        return;
      }

      const rpcResult = await supabase.rpc('get_public_business_directory');

      if (!cancelled && !rpcResult.error && rpcResult.data && rpcResult.data.length > 0) {
        setListings(rpcResult.data as DirectoryListing[]);
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('business_directory_listings')
        .select(
          'id,business_name,slug,short_description,categories,city,state,service_area,phone,email,website_url,google_business_url,google_rating,google_review_count,facebook_page_url,facebook_rating,facebook_review_count,logo_url,cover_image_url,is_verified,is_featured,is_network_member,receptionist_enabled,booking_url,receptionist_url,listing_status'
        )
        .eq('listing_status', 'active')
        .order('is_featured', { ascending: false })
        .order('is_verified', { ascending: false })
        .order('business_name', { ascending: true });

      if (!cancelled) {
        if (!error && data && data.length > 0) {
          setListings(data as DirectoryListing[]);
        }
        setLoading(false);
      }
    };

    void loadListings();

    return () => {
      cancelled = true;
    };
  }, []);

  const categories = useMemo(() => {
    const unique = new Set<string>();
    for (const listing of listings) {
      for (const category of listing.categories || []) unique.add(category);
    }
    return ['All', ...Array.from(unique).sort()];
  }, [listings]);

  const cities = useMemo(() => {
    const unique = new Set<string>();
    for (const listing of listings) {
      const cityLabel = [listing.city, listing.state].filter(Boolean).join(', ');
      if (cityLabel) unique.add(cityLabel);
    }
    return ['All', ...Array.from(unique).sort()];
  }, [listings]);

  const filteredListings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return listings.filter((listing) => {
      const cityLabel = [listing.city, listing.state].filter(Boolean).join(', ');
      const matchesQuery =
        !normalizedQuery ||
        listing.business_name.toLowerCase().includes(normalizedQuery) ||
        listing.short_description.toLowerCase().includes(normalizedQuery) ||
        listing.categories.some((category) => category.toLowerCase().includes(normalizedQuery)) ||
        cityLabel.toLowerCase().includes(normalizedQuery);

      const matchesCategory = selectedCategory === 'All' || listing.categories.includes(selectedCategory);
      const matchesCity = selectedCity === 'All' || cityLabel === selectedCity;
      const matchesVerified = !showVerifiedOnly || listing.is_verified;
      const matchesReceptionist = !showReceptionistOnly || listing.receptionist_enabled;

      return matchesQuery && matchesCategory && matchesCity && matchesVerified && matchesReceptionist;
    });
  }, [listings, query, selectedCategory, selectedCity, showVerifiedOnly, showReceptionistOnly]);

  return (
    <div className="min-h-screen text-white">
      <div className="hero-glow border-b border-white/10 px-6 pb-14 pt-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex items-center justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-gray-300 transition hover:border-white/20 hover:text-white"
            >
              <ArrowUpRight size={16} className="rotate-180" />
              Back to Hub
            </Link>
            <div className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200">
              <Sparkles size={14} />
              Community Business Directory
            </div>
          </div>

          <div className="grid gap-10 lg:grid-cols-[1.4fr_0.8fr]">
            <div>
              <h1 className="mb-4 text-5xl font-black leading-tight">
                Discover local businesses,
                <span className="gradient-text"> compare trust signals,</span> and book faster.
              </h1>
              <p className="max-w-3xl text-lg leading-8 text-gray-300">
                Browse contractors and neighborhood businesses across the CDI community. Filter by service type, location,
                verification, and AI receptionist availability, then jump straight into scheduling when a listing is ready for it.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <a
                  href={DIRECTORY_APPLY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  List Your Business
                  <ArrowUpRight size={16} />
                </a>
                <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-gray-300">
                  Uses the existing Renovision onboarding and business setup flow
                </span>
              </div>
            </div>

            <div className="glass rounded-[2rem] border border-white/10 p-6">
              <div className="mb-4 flex items-center gap-3 text-white">
                <div className="rounded-2xl bg-white/10 p-3">
                  <Building2 size={22} />
                </div>
                <div>
                  <div className="text-sm uppercase tracking-[0.2em] text-cyan-200">Directory Value</div>
                  <div className="text-xl font-bold">Open to the whole community</div>
                </div>
              </div>
              <div className="space-y-3 text-sm text-gray-300">
              <p>Businesses can buy visibility in the public directory and add their Google or Facebook trust signals.</p>
              <p>Verified or receptionist-enabled listings can send people straight into AI-assisted scheduling and follow-up.</p>
              <p>CDI network businesses still stand out with stronger badges, deeper integrations, and priority routing.</p>
            </div>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-6 py-12">
        <section className="glass mb-10 rounded-[2rem] border border-white/10 p-6">
          <div className="mb-6 flex items-center gap-3 text-lg font-semibold">
            <Filter size={20} className="text-cyan-300" />
            Find the right business
          </div>

          <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
            <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <Search size={18} className="text-gray-400" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by business, service, or location"
                className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
              />
            </label>

            <select
              value={selectedCategory}
              onChange={(event) => setSelectedCategory(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category} className="bg-slate-900">
                  {category}
                </option>
              ))}
            </select>

            <select
              value={selectedCity}
              onChange={(event) => setSelectedCity(event.target.value)}
              className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm text-white outline-none"
            >
              {cities.map((city) => (
                <option key={city} value={city} className="bg-slate-900">
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => setShowVerifiedOnly((value) => !value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                showVerifiedOnly ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              Verified only
            </button>
            <button
              type="button"
              onClick={() => setShowReceptionistOnly((value) => !value)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                showReceptionistOnly ? 'border-cyan-300 bg-cyan-300/15 text-cyan-100' : 'border-white/10 bg-white/5 text-gray-300'
              }`}
            >
              AI receptionist available
            </button>
          </div>
        </section>

        <section className="mb-6 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Directory Listings</h2>
            <p className="text-sm text-gray-400">
              {loading ? 'Loading listings...' : `${filteredListings.length} businesses currently match your filters.`}
            </p>
          </div>
          <div className="text-xs uppercase tracking-[0.2em] text-gray-500">
            Google and Facebook trust signals ready
          </div>
        </section>

        <section className="grid gap-6">
          {filteredListings.map((listing) => {
            const cityLabel = [listing.city, listing.state].filter(Boolean).join(', ');
            return (
              <article
                key={listing.id}
                className="app-card rounded-[2rem] border border-white/10 p-6"
              >
                <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
                  <div>
                    <div className="mb-4 flex flex-wrap gap-2">
                      {listing.is_featured && (
                        <span className={`${badgeBase} border-cyan-400/30 bg-cyan-400/15 text-cyan-100`}>
                          Featured
                        </span>
                      )}
                      {listing.is_verified && (
                        <span className={`${badgeBase} border-emerald-400/30 bg-emerald-400/15 text-emerald-100`}>
                          <ShieldCheck size={12} />
                          Verified
                        </span>
                      )}
                      {listing.is_network_member && (
                        <span className={`${badgeBase} border-violet-400/30 bg-violet-400/15 text-violet-100`}>
                          CDI Network
                        </span>
                      )}
                      {listing.receptionist_enabled && (
                        <span className={`${badgeBase} border-blue-400/30 bg-blue-400/15 text-blue-100`}>
                          AI Booking
                        </span>
                      )}
                    </div>

                    <div className="mb-3 flex items-start justify-between gap-4">
                      <div>
                        <h3 className="text-3xl font-bold text-white">{listing.business_name}</h3>
                        <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-400">
                          {cityLabel && (
                            <span className="inline-flex items-center gap-2">
                              <MapPin size={16} className="text-cyan-300" />
                              {cityLabel}
                            </span>
                          )}
                          {listing.phone && (
                            <span className="inline-flex items-center gap-2">
                              <Phone size={16} className="text-cyan-300" />
                              {listing.phone}
                            </span>
                          )}
                        </div>
                      </div>

                      {(listing.google_rating || listing.facebook_rating) && (
                        <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-right">
                          <div className="text-[11px] uppercase tracking-[0.2em] text-gray-500">Trust Signals</div>
                          <div className="mt-2 flex items-center gap-2 text-amber-300">
                            <Star size={16} fill="currentColor" />
                            <span className="text-lg font-bold text-white">
                              {listing.google_rating ?? listing.facebook_rating ?? 'N/A'}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    <p className="mb-5 max-w-4xl text-gray-300">{listing.short_description}</p>

                    <div className="mb-5 flex flex-wrap gap-2">
                      {listing.categories.map((category) => (
                        <span
                          key={category}
                          className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs uppercase tracking-[0.18em] text-gray-300"
                        >
                          {category}
                        </span>
                      ))}
                    </div>

                    <div className="flex flex-wrap gap-3">
                      {listing.receptionist_enabled && listing.receptionist_url && (
                        <a
                          href={listing.receptionist_url}
                          className="btn-primary inline-flex items-center gap-2"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Schedule with AI Receptionist
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                      {!listing.receptionist_enabled && listing.website_url && (
                        <a
                          href={listing.website_url}
                          className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Visit Website
                          <ExternalLink size={16} />
                        </a>
                      )}
                      {listing.booking_url && (
                        <a
                          href={listing.booking_url}
                          className="inline-flex items-center gap-2 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-medium text-cyan-100 transition hover:border-cyan-300/30"
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open Booking Page
                          <ArrowUpRight size={16} />
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="glass rounded-[1.75rem] border border-white/10 p-5">
                    <div className="mb-4 text-sm uppercase tracking-[0.22em] text-gray-500">Review Sources</div>
                    <div className="space-y-4">
                      <ReviewSource
                        name="Google Business"
                        rating={listing.google_rating}
                        reviewCount={listing.google_review_count}
                        href={listing.google_business_url}
                      />
                      <ReviewSource
                        name="Facebook"
                        rating={listing.facebook_rating}
                        reviewCount={listing.facebook_review_count}
                        href={listing.facebook_page_url}
                      />
                    </div>

                    <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                      <div className="mb-2 font-semibold text-white">Service Area</div>
                      <div>{listing.service_area || cityLabel || 'Community-wide'}</div>
                    </div>

                    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-300">
                      <div className="mb-2 font-semibold text-white">Listing Status</div>
                      <div className="flex items-center gap-2 text-emerald-200">
                        <CheckCircle2 size={16} />
                        Public directory active
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}

          {!loading && filteredListings.length === 0 && (
            <div className="glass rounded-[2rem] border border-white/10 px-8 py-14 text-center">
              <h3 className="mb-2 text-2xl font-bold text-white">No live directory listings are showing yet.</h3>
              <p className="mx-auto max-w-2xl text-gray-400">
                This page is now fully live-data driven. Once businesses are available through the shared Supabase directory data,
                they will appear here automatically.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <a
                  href={DIRECTORY_APPLY_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="btn-primary inline-flex items-center gap-2"
                >
                  Start Business Signup
                  <ArrowUpRight size={16} />
                </a>
                <Link
                  to="/"
                  className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:border-white/20"
                >
                  Return to Hub
                </Link>
              </div>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

type ReviewSourceProps = {
  name: string;
  rating: number | null;
  reviewCount: number | null;
  href: string;
};

function ReviewSource({ name, rating, reviewCount, href }: ReviewSourceProps): React.JSX.Element {
  const hasData = typeof rating === 'number' || typeof reviewCount === 'number';

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between gap-4">
        <div className="font-semibold text-white">{name}</div>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-cyan-200 hover:text-cyan-100"
          >
            View
            <ExternalLink size={12} />
          </a>
        ) : null}
      </div>
      {hasData ? (
        <div className="flex items-center gap-2 text-sm text-gray-300">
          <Star size={15} className="text-amber-300" fill="currentColor" />
          <span className="font-semibold text-white">{rating ?? 'N/A'}</span>
          <span className="text-gray-500">•</span>
          <span>{reviewCount ?? 0} reviews</span>
        </div>
      ) : (
        <div className="text-sm text-gray-500">Profile link ready for sync</div>
      )}
    </div>
  );
}
