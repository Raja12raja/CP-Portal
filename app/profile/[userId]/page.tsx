import FriendProfile from "@/app/components/FriendProfile"

export default function ProfilePage({ params }: { params: { userId: string } }) {
  return <FriendProfile params={params} />
}
