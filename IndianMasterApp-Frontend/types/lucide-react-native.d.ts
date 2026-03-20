declare module 'lucide-react-native' {
    import { SvgProps } from 'react-native-svg';
    import { ComponentType } from 'react';

    export interface IconProps extends SvgProps {
        size?: number | string;
        absoluteStrokeWidth?: boolean;
        color?: string;
    }

    export type Icon = ComponentType<IconProps>;
    export type LucideIcon = Icon; // Alias for compatibility


    export const ArrowLeft: Icon;
    export const ArrowRight: Icon;
    export const ChefHat: Icon;
    export const Utensils: Icon;
    export const Wrench: Icon;
    export const User: Icon;
    export const SprayCan: Icon;
    export const Bike: Icon;
    export const Building2: Icon;
    export const LogOut: Icon;
    export const Settings: Icon;
    export const MapPin: Icon;
    export const Star: Icon;
    export const Search: Icon;
    export const Bell: Icon;
    export const MessageCircle: Icon;
    export const Briefcase: Icon;
    export const Plus: Icon;
    export const Calendar: Icon;
    export const Menu: Icon;
    export const Clipboard: Icon;
    export const Lock: Icon;
    export const Phone: Icon;
    export const Check: Icon;
    export const CreditCard: Icon;
    export const Camera: Icon;
    export const UtensilsCrossed: Icon;
    export const BedDouble: Icon;
    export const Coffee: Icon;
    export const Cloud: Icon;
    export const ChevronRight: Icon;
    export const Store: Icon;
    export const Globe: Icon;
    export const Moon: Icon;
    export const Clock: Icon;
    export const DollarSign: Icon;
    export const Building: Icon;
    export const Users: Icon;
    export const CheckCircle: Icon;
    export const TrendingUp: Icon;
    export const X: Icon;
    export const Mail: Icon;
    export const Send: Icon;
    export const Bot: Icon;
    // Add more as needed
}
