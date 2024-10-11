import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js"
import { loadStripe } from "@stripe/stripe-js"
import { FormEvent, useState } from "react";
import toast from "react-hot-toast";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { NewOrderRequest } from "../types/api-types";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { useNewOrderMutation } from "../redux/api/orderAPI";
import { resetCart } from "../redux/reducer/cartReducer";
import { responseToast } from "../utils/features";


const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_KEY
    );

const CheckOutForm=()=>{ 

    const stripe=useStripe();
    const elements=useElements();
    const navigate=useNavigate();
    const dispatch=useDispatch();

    const {user}=useSelector((state:RootState)=>state.userReducer);

    const {
        shippingInfo,
        cartItems,
        subtotal,
        tax,
        discount,
        shippingCharges,
        total,
    }   =useSelector((state:RootState)=>state.cartReducer)   

    const[newOrder]=useNewOrderMutation();
    
    const [isProcesseing,setIsProcessing]=useState<boolean>(false);


    const submitHandler=async(e:FormEvent<HTMLFormElement>)=>{

        e.preventDefault();

        const orderData:NewOrderRequest={
            shippingInfo,
            orderItems:cartItems,
            subtotal,
            tax,
            discount,
            shippingCharges,
            total,
            user:user?._id!

        };

        
    if(!stripe || !elements)return;
    setIsProcessing(true);
    
    const {paymentIntent,error}=await stripe.confirmPayment({
        elements,
        confirmParams:{return_url:window.location.origin},
        redirect:"if_required",
    
    })
    
    if(error){
        setIsProcessing(false);
        return toast.error(error.message || "Something Went Wrong");

        }
    if(paymentIntent.status==="succeeded"){
        const res=await newOrder(orderData);
        dispatch(resetCart());
        
        responseToast(res,navigate,"/orders");
        
    }
    setIsProcessing(false);
    
    };
    

    return (
    <div className="checkout-container">
        <form onSubmit={submitHandler}>
            <PaymentElement/>
            <button type="submit" disabled={isProcesseing} >{isProcesseing?"Processing...":"Pay"}</button>
        </form>
    </div> 
)
}


const Checkout = () => {

    const location =useLocation();
    const clientSecret:string|undefined=location.state;
    
    if(!clientSecret) return <Navigate to={"/shipping"}/>


  return (
    <Elements options={{clientSecret}} 
    stripe={stripePromise}>
        <CheckOutForm/>
    </Elements>
  )
}

export default Checkout