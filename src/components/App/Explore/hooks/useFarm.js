import { useEffect, useState } from "react"
import { auth, db } from "../../../../services/firebase"
import { collection, query, where, onSnapshot } from "firebase/firestore"

export function useFarm() {
  const [farmData, setFarmData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let unsubscribeFarm = null

    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (!user) {
        setFarmData(null)
        setLoading(false)
        return
      }

      setLoading(true)

      const q = query(
        collection(db, "farms"),
        where("ownerId", "==", user.uid)
      )

      unsubscribeFarm = onSnapshot(
        q,
        (snapshot) => {
        if (!snapshot.empty) {
            const farmDoc = snapshot.docs[0]
            setFarmData({
              id: farmDoc.id,
              ...farmDoc.data()
            })
          } else {
            setFarmData(null)
          }

          setLoading(false)
        },
        (error) => {
          console.error("Erro ao buscar fazenda:", error)
          setLoading(false)
        }
      )
    })

    return () => {
      if (unsubscribeFarm) unsubscribeFarm()
      unsubscribeAuth()
    }
  }, [])

  return { farmData, loading }
}
