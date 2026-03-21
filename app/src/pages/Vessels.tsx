import { useState, useCallback, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  Ship,
  Search,
  XCircle,
  ChevronRight,
  Calendar,
  Box,
  Grid3X3,
  MoveHorizontal,
  Wrench,
  Footprints,
  Link2,
  Minus,
  Settings,
  Layers,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useVesselSearch, useVesselDetails, useVesselList } from '../hooks/useVessels';
import type { Vessel } from '../hooks/useVessels';

// ---- Equipment Section ----

function EquipmentSection({
  title,
  icon: Icon,
  items,
}: {
  title: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  items: string[];
}) {
  if (!items || items.length === 0) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <Icon size={16} className="text-slate-600" />
        <span className="text-sm font-semibold text-slate-700">{title}</span>
        <span className="bg-slate-100 px-1.5 py-0.5 rounded text-xs text-slate-500">
          {items.length}
        </span>
      </div>
      {items.map((item, i) => (
        <p key={i} className="text-sm text-slate-600 ml-6 mb-0.5">
          {'\u2022'} {item}
        </p>
      ))}
    </div>
  );
}

// ---- Detail Card ----

function VesselDetailCard({ vessel }: { vessel: Vessel }) {
  return (
    <div className="overflow-y-auto flex-1">
      {/* Header */}
      <div className="bg-blue-600 rounded-2xl p-5 mb-4">
        <h2 className="text-2xl font-bold text-white mb-1">{vessel.name}</h2>
        {vessel.former_names && (
          <p className="text-blue-200 text-xs mb-2">Formerly: {vessel.former_names}</p>
        )}
        <div className="flex flex-wrap gap-3 mt-2">
          {vessel.year_built && (
            <div className="flex items-center gap-1">
              <Calendar size={14} className="text-blue-200" />
              <span className="text-blue-100 text-sm">Built {vessel.year_built}</span>
            </div>
          )}
          {vessel.teu && (
            <div className="flex items-center gap-1">
              <Box size={14} className="text-blue-200" />
              <span className="text-blue-100 text-sm">{vessel.teu.toLocaleString()} TEU</span>
            </div>
          )}
          {vessel.bays && (
            <div className="flex items-center gap-1">
              <Grid3X3 size={14} className="text-blue-200" />
              <span className="text-blue-100 text-sm">{vessel.bays} bays</span>
            </div>
          )}
          {vessel.width && (
            <div className="flex items-center gap-1">
              <MoveHorizontal size={14} className="text-blue-200" />
              <span className="text-blue-100 text-sm">{vessel.width} wide</span>
            </div>
          )}
        </div>
        <p className="text-blue-300 text-xs mt-3">IMO {vessel.imo}</p>
      </div>

      {/* Equipment Sections */}
      <EquipmentSection title="Deck Lashing" icon={Wrench} items={vessel.deck_lashing} />
      <EquipmentSection title="Walkways" icon={Footprints} items={vessel.walkways} />
      <EquipmentSection title="Lashing" icon={Link2} items={vessel.lashing} />
      <EquipmentSection title="Bars" icon={Minus} items={vessel.bars} />
      <EquipmentSection title="Turnbuckles" icon={Settings} items={vessel.turnbuckles} />
      <EquipmentSection title="Stackers" icon={Layers} items={vessel.stackers} />

      {/* Notes */}
      {vessel.notes.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle size={16} className="text-amber-600" />
            <span className="text-sm font-semibold text-amber-800">Notes</span>
          </div>
          {vessel.notes.map((note, i) => (
            <p key={i} className="text-sm text-amber-700 mb-1">
              {'\u2022'} {note}
            </p>
          ))}
        </div>
      )}

      <div className="h-10" />
    </div>
  );
}

// ---- Search Result Item ----

function VesselListItem({
  vessel,
  onPress,
}: {
  vessel: Pick<Vessel, 'imo' | 'name' | 'year_built' | 'teu' | 'bays'>;
  onPress: () => void;
}) {
  return (
    <button
      onClick={onPress}
      className="w-full bg-white border border-slate-200 rounded-xl p-4 mb-2 flex items-center text-left hover:border-slate-300 transition-colors"
    >
      <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mr-3">
        <Ship size={20} className="text-blue-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-800 truncate">{vessel.name}</p>
        <p className="text-xs text-slate-400">
          {[
            vessel.year_built && `Built ${vessel.year_built}`,
            vessel.teu && `${vessel.teu.toLocaleString()} TEU`,
            vessel.bays && `${vessel.bays} bays`,
          ]
            .filter(Boolean)
            .join(' \u2022 ')}
        </p>
      </div>
      <ChevronRight size={18} className="text-slate-300" />
    </button>
  );
}

// ---- Main Screen ----

export function Vessels() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [searchText, setSearchText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIMO, setSelectedIMO] = useState<number | null>(
    searchParams.get('imo') ? parseInt(searchParams.get('imo')!, 10) : null
  );
  const [page, setPage] = useState(0);

  // Hooks
  const { data: searchResults = [], isFetching: searching } = useVesselSearch(searchQuery);
  const { data: vesselDetail, isLoading: loadingDetail } = useVesselDetails(selectedIMO);
  const { data: listData, isLoading: loadingList } = useVesselList(page);

  const vessels = listData?.vessels ?? [];
  const totalVessels = listData?.total ?? 0;

  // Debounced search
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleSearchChange = useCallback((text: string) => {
    setSearchText(text);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(text.trim());
    }, 300);
  }, []);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleSelectVessel = useCallback((imo: number) => {
    setSelectedIMO(imo);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedIMO(null);
  }, []);

  // Infinite scroll handler
  const listContainerRef = useRef<HTMLDivElement>(null);
  const handleScroll = useCallback(() => {
    const el = listContainerRef.current;
    if (!el) return;
    if (!searchQuery && vessels.length < totalVessels) {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 200;
      if (nearBottom) {
        setPage((p) => p + 1);
      }
    }
  }, [searchQuery, vessels.length, totalVessels]);

  // If showing vessel details
  if (selectedIMO) {
    return (
      <div className="flex flex-col bg-slate-50 min-h-screen">
        <div className="flex-1 px-4 pt-4 flex flex-col max-w-2xl mx-auto w-full">
          {/* Back header */}
          <div className="flex items-center mb-4">
            <button
              onClick={handleBackToList}
              className="flex items-center gap-1 mr-4 hover:bg-slate-100 rounded-lg p-1 transition-colors"
            >
              <ArrowLeft size={20} className="text-blue-500" />
              <span className="text-blue-500 font-medium">Vessels</span>
            </button>
          </div>

          {loadingDetail ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Loader2 size={32} className="text-blue-500 animate-spin" />
              <p className="text-slate-400 text-sm mt-2">Loading vessel details...</p>
            </div>
          ) : vesselDetail ? (
            <VesselDetailCard vessel={vesselDetail} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center">
              <Ship size={48} className="text-slate-300" />
              <p className="text-slate-400 text-sm mt-2">Vessel not found</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Search results or browse list
  const displayList = searchQuery.length >= 2 ? searchResults : vessels;
  const isLoading = searchQuery.length >= 2 ? searching : loadingList;

  return (
    <div className="flex flex-col bg-slate-50 min-h-screen">
      <div className="flex-1 px-4 pt-4 flex flex-col max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(-1)}
              className="hover:bg-slate-100 rounded-lg p-1 transition-colors"
            >
              <ArrowLeft size={22} className="text-slate-800" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-800">Vessels</h1>
              <p className="text-xs text-slate-400">
                {totalVessels > 0 ? `${totalVessels} vessels in database` : 'Ship lashing info'}
              </p>
            </div>
          </div>
          <Ship size={24} className="text-blue-500" />
        </div>

        {/* Search */}
        <div className="flex items-center bg-white border border-slate-200 rounded-xl px-3 mb-4">
          <Search size={18} className="text-slate-400" />
          <input
            value={searchText}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search vessels..."
            className="flex-1 px-2 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none bg-transparent"
            style={{ textTransform: 'uppercase' }}
          />
          {searchText.length > 0 && (
            <button
              onClick={() => {
                setSearchText('');
                setSearchQuery('');
              }}
              className="hover:opacity-70 transition-opacity"
            >
              <XCircle size={18} className="text-slate-400" />
            </button>
          )}
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 size={32} className="text-blue-500 animate-spin" />
          </div>
        ) : displayList.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Ship size={48} className="text-slate-300" />
            <p className="text-slate-400 text-sm mt-2">
              {searchQuery.length >= 2 ? 'No vessels found' : 'No vessels loaded yet'}
            </p>
          </div>
        ) : (
          <div
            ref={listContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto pb-10"
          >
            {displayList.map((item) => (
              <VesselListItem
                key={item.imo}
                vessel={item}
                onPress={() => handleSelectVessel(item.imo)}
              />
            ))}
            {!searchQuery && vessels.length < totalVessels && (
              <div className="flex justify-center py-4">
                <Loader2 size={20} className="text-blue-400 animate-spin" />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
