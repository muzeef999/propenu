import { setProfileField } from "@/Redux/slice/postPropertySlice";
import { useDispatch } from "react-redux";

 const  ResidentialProfile = () => {

      const dispatch = useDispatch();

    return (
        <>
        <h1>ResidentialProfile</h1>
  
      <input
        placeholder="BHK"
        onChange={(e) =>
          dispatch(
            setProfileField({
              key: "bhk",
              value: Number(e.target.value),
            })
          )
        }
      />

      <input
        placeholder="Bedrooms"
        onChange={(e) =>
          dispatch(
            setProfileField({
              key: "bedrooms",
              value: Number(e.target.value),
            })
          )
        }
      />
        </>
    )
}

export default ResidentialProfile