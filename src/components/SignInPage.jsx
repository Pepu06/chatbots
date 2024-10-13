import React from 'react'
import { SignIn } from "@clerk/clerk-react";


const SignInPage = () => {
  return (
    <div className='flex flex-col items-center justify-center h-screen bg-[rgb(22,24,25)]'>
        <SignIn />
    </div>
  )
}

export default SignInPage