import { Box, Typography, Stack, TextField, Button, Link } from "@mui/material"

export const SignInPanel = ({handleSubmit} : {handleSubmit : (event: React.FormEvent<HTMLFormElement>) => void}) => {
    return(
        <Box
        sx={{
          display: 'flex',
          height:'100%',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent:'center'
        }}
      >
        <img alt="logo" src="logo.svg" width="150px" height="auto" />
        <Typography component="h1" variant="h5">
          Sign in
        </Typography>
        <Box component="form" noValidate onSubmit={handleSubmit} sx={{ mt: 3, pb: 2, width:{mobile: '100%', tablet:'50%', desktop:'75%'}}}>
          <Stack spacing={3} width='100%' sx={{ display:'flex', justifyContent:'center', alignItems:'center'}}>
            <TextField
              aria-label="username-field"
              name="username"
              required
              fullWidth
              id="username"
              label="Username"
              autoFocus
              sx={{width: {mobile:'75%', desktop:'50%'}}}
            />
            <TextField
              aria-label="password-field"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="new-password"
              sx={{width: {mobile:'75%', desktop:'50%'}}}
            />
            <Button type="submit" variant="contained" sx={{ mt: 3, mb: 2, width:'50%', maxWidth:'50%' }}>
              Sign In
            </Button>
            <Link href="/reset-password" variant="body1">
              Forgot password?
            </Link>
            <Link href="/signup" variant="body1">
              Not a member? Register now!
            </Link>
          </Stack>
        </Box>
      </Box>
    )
}