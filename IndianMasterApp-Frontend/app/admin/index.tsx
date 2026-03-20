import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { Users, Briefcase, CheckCircle, TrendingUp } from 'lucide-react-native';
import Card from '@/components/Card';
import { COLORS } from '@/constants/theme';

const { width } = Dimensions.get('window');

export default function AdminDashboard() {
  const stats = [
    { title: 'Total Users', value: '12,543', icon: Users, color: COLORS.info },
    { title: 'Active Jobs', value: '1,234', icon: Briefcase, color: COLORS.success },
    { title: 'Verified Workers', value: '8,765', icon: CheckCircle, color: COLORS.warning },
    { title: 'Monthly Growth', value: '+23%', icon: TrendingUp, color: COLORS.error },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <Text style={styles.subtitle}>Indian Master - Restaurant Hiring Platform</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.statsGrid}>
          {stats.map((stat, index) => (
            <Card key={index} style={[styles.statCard, { width: (width - 60) / 2 }]}>
              <stat.icon size={32} color={stat.color} />
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statTitle}>{stat.title}</Text>
            </Card>
          ))}
        </View>

        <Card style={styles.chartCard}>
          <Text style={styles.chartTitle}>User Registration Trends</Text>
          <View style={styles.chartPlaceholder}>
            <Text style={styles.chartText}>📊 Chart visualization would go here</Text>
          </View>
        </Card>

        <Card style={styles.recentActivity}>
          <Text style={styles.activityTitle}>Recent Activity</Text>
          <View style={styles.activityList}>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>New restaurant registered: Spice Garden</Text>
              <Text style={styles.activityTime}>2 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Worker verification completed: Rajesh Kumar</Text>
              <Text style={styles.activityTime}>4 hours ago</Text>
            </View>
            <View style={styles.activityItem}>
              <Text style={styles.activityText}>Job posted: Cook position at Hotel Maharaja</Text>
              <Text style={styles.activityTime}>6 hours ago</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    backgroundColor: COLORS.white,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 20,
  },
  statCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: 12,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: COLORS.borderLight,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  recentActivity: {
    marginBottom: 20,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 16,
  },
  activityList: {
    gap: 12,
  },
  activityItem: {
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  activityText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  activityTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});