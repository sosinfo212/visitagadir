import {
  UtensilsCrossed,
  Hotel,
  Waves,
  ShoppingBag,
  Heart,
  GraduationCap,
  Car,
  Briefcase,
  Music,
  Compass,
  Home as HomeIcon,
  Sparkles,
  Building2,
} from 'lucide-react'

export const categoryIconMap: Record<string, React.ReactNode> = {
  UtensilsCrossed: <UtensilsCrossed className="h-6 w-6" />,
  Hotel: <Hotel className="h-6 w-6" />,
  Waves: <Waves className="h-6 w-6" />,
  ShoppingBag: <ShoppingBag className="h-6 w-6" />,
  Heart: <Heart className="h-6 w-6" />,
  GraduationCap: <GraduationCap className="h-6 w-6" />,
  Car: <Car className="h-6 w-6" />,
  Briefcase: <Briefcase className="h-6 w-6" />,
  Music: <Music className="h-6 w-6" />,
  Compass: <Compass className="h-6 w-6" />,
  Home: <HomeIcon className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
}

const defaultCategoryIcon = <Building2 className="h-6 w-6" />

export function getCategoryIcon(icon: string | null | undefined): React.ReactNode {
  if (!icon) return defaultCategoryIcon
  return categoryIconMap[icon] ?? defaultCategoryIcon
}

export const categoryBgColors: Record<string, string> = {
  'restaurants-cafes': 'bg-orange-50 border-orange-200 hover:bg-orange-100',
  'hotels-accommodation': 'bg-purple-50 border-purple-200 hover:bg-purple-100',
  'beaches-water-sports': 'bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  'shopping-markets': 'bg-pink-50 border-pink-200 hover:bg-pink-100',
  'health-wellness': 'bg-red-50 border-red-200 hover:bg-red-100',
  'education-training': 'bg-blue-50 border-blue-200 hover:bg-blue-100',
  'transport-car-rental': 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  'professional-services': 'bg-slate-50 border-slate-200 hover:bg-slate-100',
  'nightlife-entertainment': 'bg-violet-50 border-violet-200 hover:bg-violet-100',
  'tours-excursions': 'bg-amber-50 border-amber-200 hover:bg-amber-100',
  'home-services': 'bg-lime-50 border-lime-200 hover:bg-lime-100',
  'beauty-personal-care': 'bg-fuchsia-50 border-fuchsia-200 hover:bg-fuchsia-100',
}
